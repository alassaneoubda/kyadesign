/**
 * Limites d'envoi des images d'une réalisation, partagées par le navigateur et le serveur.
 * Vercel refuse toute requête de plus de 4,5 Mo : les images sont donc envoyées une par une
 * (chacune sous 4 Mo), et les plafonds ci-dessous portent sur l'ensemble d'une soumission.
 * Auteur : Kya Design — 2026-09-30 — v1
 */

const MB = 1024 * 1024;

/** Nombre maximal d'images (couverture + galerie) par soumission. */
export const MAX_IMAGES_PER_SUBMISSION = 100;

/** Poids total maximal des images réellement envoyées (après optimisation dans le navigateur). */
export const MAX_SUBMISSION_BYTES = 25 * MB;

/** Poids maximal d'une image dans une requête (marge sous la limite de 4,5 Mo de Vercel). */
export const MAX_IMAGE_REQUEST_BYTES = 4 * MB;

export type SubmissionCheck =
  | { ok: true; count: number; bytes: number }
  | { ok: false; code: "count" | "total" | "file"; count: number; bytes: number };

/**
 * Vérifie qu'une soumission respecte les plafonds (nombre, poids total, poids par image).
 * @param sizes Poids en octets de chaque image envoyée.
 * @returns ok, ou le premier plafond dépassé.
 */
export function checkSubmission(sizes: readonly number[]): SubmissionCheck {
  const count = sizes.length;
  const bytes = sizes.reduce((total, size) => total + size, 0);
  if (count > MAX_IMAGES_PER_SUBMISSION) return { ok: false, code: "count", count, bytes };
  if (sizes.some((size) => size > MAX_IMAGE_REQUEST_BYTES)) return { ok: false, code: "file", count, bytes };
  if (bytes > MAX_SUBMISSION_BYTES) return { ok: false, code: "total", count, bytes };
  return { ok: true, count, bytes };
}

/**
 * Poids lisible en mégaoctets, à la française (ex. « 4,3 Mo »).
 * @param bytes Poids en octets.
 */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / MB).toFixed(1).replace(".", ",")} Mo`;
}

/**
 * Message affiché quand une soumission dépasse un plafond.
 * @param check Résultat de checkSubmission en échec.
 */
export function submissionErrorMessage(check: Extract<SubmissionCheck, { ok: false }>): string {
  if (check.code === "count") {
    return `${check.count} images sélectionnées : ${MAX_IMAGES_PER_SUBMISSION} maximum par enregistrement. Retire-en ${
      check.count - MAX_IMAGES_PER_SUBMISSION
    }.`;
  }
  if (check.code === "file") {
    return `Une image dépasse ${formatMegabytes(MAX_IMAGE_REQUEST_BYTES)} même après optimisation. Exporte-la en JPG.`;
  }
  return `Images trop lourdes : ${formatMegabytes(check.bytes)} au total, ${formatMegabytes(
    MAX_SUBMISSION_BYTES
  )} maximum. Retire quelques images.`;
}
