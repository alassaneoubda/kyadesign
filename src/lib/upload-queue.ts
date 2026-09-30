/**
 * File d'envoi d'images : plusieurs envois en parallèle, résultats mis en cache (une nouvelle tentative
 * ne renvoie pas les images déjà acceptées), erreurs regroupées. Sans dépendance au navigateur : testable.
 * Auteur : Kya Design — 2026-09-30 — v1
 */

/** Envoi en échec : message lisible, noms des fichiers concernés. */
export class UploadBatchError extends Error {
  constructor(public readonly failures: string[]) {
    super(
      failures.length === 1
        ? failures[0]
        : `${failures.length} images n'ont pas pu être envoyées : ${failures.slice(0, 3).join(" · ")}${
            failures.length > 3 ? " …" : ""
          }`
    );
    this.name = "UploadBatchError";
  }
}

export type QueueOptions<T, R> = {
  /** Envois simultanés (4 par défaut). */
  workers?: number;
  /** Résultats déjà obtenus (clé = élément envoyé). */
  cache: WeakMap<T & object, R>;
  /** Appelé après chaque envoi terminé (réussi ou non). */
  onProgress?: (done: number, total: number) => void;
};

/**
 * Envoie tous les éléments et renvoie les résultats dans le même ordre.
 * @param items Éléments à envoyer (ex. fichiers).
 * @param send Envoi d'un élément ; lève une erreur (message lisible) en cas d'échec.
 * @param options Parallélisme, cache, progression.
 * @returns Résultats, dans l'ordre des éléments.
 * @throws UploadBatchError si au moins un envoi échoue (les réussites restent en cache).
 */
export async function runUploads<T extends object, R>(
  items: readonly T[],
  send: (item: T) => Promise<R>,
  options: QueueOptions<T, R>
): Promise<R[]> {
  const results: (R | undefined)[] = items.map((item) => options.cache.get(item));
  const pending = items.map((_, index) => index).filter((index) => results[index] === undefined);
  const failures: string[] = [];
  let done = items.length - pending.length;
  options.onProgress?.(done, items.length);

  async function worker() {
    for (let index = pending.shift(); index !== undefined; index = pending.shift()) {
      try {
        const result = await send(items[index]);
        options.cache.set(items[index], result);
        results[index] = result;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "Envoi impossible.");
      }
      done += 1;
      options.onProgress?.(done, items.length);
    }
  }

  const workers = Math.max(1, Math.min(options.workers ?? 4, pending.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  if (failures.length > 0) throw new UploadBatchError(failures);
  return results as R[];
}
