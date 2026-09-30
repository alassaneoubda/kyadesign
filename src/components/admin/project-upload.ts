/**
 * Envoi des images d'une réalisation depuis le navigateur, une par requête (limite Vercel : 4,5 Mo).
 * Délai maximal de 60 s par image, 3 essais avec attente croissante sur les erreurs passagères.
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import { withRetry } from "@/lib/retry";
import { runUploads } from "@/lib/upload-queue";
import type { UploadReceipt } from "@/lib/upload-receipt";

const ENDPOINT = "/api/admin/project-images";
const TIMEOUT_MS = 60_000;

/** Erreur passagère (réseau, serveur, délai dépassé) : un nouvel essai a des chances d'aboutir. */
class TransientUploadError extends Error {}

function readableStatus(status: number): string {
  if (status === 401) return "session expirée, reconnecte-toi";
  if (status === 413) return "image trop lourde (4 Mo maximum)";
  return `erreur ${status}`;
}

async function sendOnce(file: File): Promise<UploadReceipt> {
  const body = new FormData();
  body.set("file", file);
  let response: Response;
  try {
    response = await fetch(ENDPOINT, { method: "POST", body, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new TransientUploadError(`${file.name} : connexion interrompue ou trop lente`);
  }
  const payload = (await response.json().catch(() => null)) as { data?: UploadReceipt; message?: string } | null;
  if (response.ok && payload?.data) return payload.data;
  const message = `${file.name} : ${payload?.message ?? readableStatus(response.status)}`;
  if (response.status >= 500 || response.status === 408 || response.status === 429) {
    throw new TransientUploadError(message);
  }
  throw new Error(message);
}

/**
 * Envoie les images (4 à la fois) et renvoie leurs reçus signés, dans l'ordre.
 * @param files Images préparées.
 * @param cache Reçus déjà obtenus (évite de renvoyer une image après un échec partiel).
 * @param onProgress Progression (envoyées, total).
 * @throws UploadBatchError avec la liste des images en échec.
 */
export function uploadProjectImages(
  files: readonly File[],
  cache: WeakMap<File, UploadReceipt>,
  onProgress: (done: number, total: number) => void
): Promise<UploadReceipt[]> {
  const send = (file: File) =>
    withRetry(() => sendOnce(file), { shouldRetry: (error) => error instanceof TransientUploadError });
  return runUploads(files, send, { cache, onProgress, workers: 4 });
}
