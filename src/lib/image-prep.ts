/**
 * Préparation des images avant envoi (règles pures, testables).
 * Les photos sont réduites dans le navigateur à la taille stockée par le serveur (1200 px) :
 * aucune perte visible, et une centaine de photos tient dans le plafond de 25 Mo par soumission.
 * Auteur : Kya Design — 2026-09-29 — v2 (2026-09-30 : 1200 px, seuil 300 Ko)
 */

/** Plus grand côté (px) après réduction dans le navigateur — identique à la taille stockée. */
export const MAX_EDGE = 1200;

/** En dessous de ce poids, une image dans un format accepté est envoyée telle quelle. */
export const KEEP_UNDER_BYTES = 300_000;

const SERVER_EXTENSIONS = /\.(jpe?g|png|webp|tiff?)$/i;
const SERVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/tiff"]);

/**
 * Dimensions réduites en conservant les proportions (jamais d'agrandissement).
 * @param width Largeur d'origine.
 * @param height Hauteur d'origine.
 * @param maxEdge Plus grand côté autorisé.
 * @returns Nouvelles dimensions entières.
 */
export function fitWithin(width: number, height: number, maxEdge: number = MAX_EDGE): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge || longest <= 0) return { width, height };
  const ratio = maxEdge / longest;
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

/**
 * Nom de fichier cohérent avec le format réellement produit.
 * @param name Nom d'origine (ex. « IMG_1234.HEIC »).
 * @param mime Type produit (image/webp, image/png, image/jpeg).
 * @returns Nom avec la bonne extension (ex. « IMG_1234.webp »).
 */
export function renamedFor(name: string, mime: string): string {
  const base = name.replace(/\.[^./\\]+$/, "").trim() || "image";
  const ext = mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : "webp";
  return `${base}.${ext}`;
}

/**
 * Indique si le serveur accepte ce fichier tel quel (extension et type).
 * @param file Nom et type MIME.
 * @returns Vrai si le format est accepté par le serveur.
 */
export function isServerFormat(file: { name: string; type: string }): boolean {
  return SERVER_EXTENSIONS.test(file.name) && (file.type === "" || SERVER_TYPES.has(file.type));
}

/**
 * Faut-il réduire / convertir l'image avant l'envoi ?
 * @param file Nom, type et poids.
 * @returns Vrai si l'image est lourde ou dans un format que le serveur refuse (HEIC, JFIF, AVIF…).
 */
export function needsPreparation(file: { name: string; type: string; size: number }): boolean {
  return !isServerFormat(file) || file.size > KEEP_UNDER_BYTES;
}
