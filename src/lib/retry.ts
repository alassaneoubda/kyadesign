/**
 * Nouvelle tentative automatique avec attente croissante (backoff exponentiel).
 * Sert à absorber les coupures passagères de la base de données (réveil, réseau, pooler saturé).
 * Auteur : Kya Design — 2026-09-29 — v1
 */

export type RetryOptions = {
  /** Nombre total d'essais (1er essai compris). */
  attempts?: number;
  /** Attente avant le 2e essai (ms) ; doublée à chaque nouvel essai. */
  baseDelayMs?: number;
  /** Appelé avant chaque nouvel essai (journalisation). */
  onRetry?: (error: unknown, attempt: number) => void;
  /** Faux = erreur définitive (ex. image refusée) : pas de nouvel essai. Par défaut, tout est réessayé. */
  shouldRetry?: (error: unknown) => boolean;
  /** Injectable pour les tests. */
  sleep?: (ms: number) => Promise<void>;
};

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Exécute `task` et réessaie en cas d'échec.
 * @param task Opération asynchrone à exécuter.
 * @param options Nombre d'essais (3 par défaut, maximum 3) et délai de base (300 ms).
 * @returns Le résultat du premier essai réussi.
 * @throws La dernière erreur si tous les essais échouent.
 */
export async function withRetry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = Math.min(3, Math.max(1, options.attempts ?? 3));
  const baseDelayMs = options.baseDelayMs ?? 300;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || options.shouldRetry?.(error) === false) break;
      options.onRetry?.(error, attempt);
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
