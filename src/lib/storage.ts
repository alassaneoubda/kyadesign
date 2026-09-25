import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);

/**
 * Extension autorisée. Les originaux ne sont jamais recompressés.
 * @param filename Nom d'origine du fichier.
 * @returns Extension en minuscules, ou une chaîne vide si le format est refusé.
 */
export function imageExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXT.has(ext) ? ext : "";
}

/**
 * Enregistre un visuel public (création, service, formation, pack, mode).
 * Stocké hors de /public pour rester accessible après un `next start`.
 * @param file Fichier du formulaire.
 * @param folder Dossier sous storage/uploads.
 * @param options.compress Redimensionne à ~1200px en WebP (Academy / site).
 * @returns Chemin public via l'API, ou null si aucun fichier.
 */
export async function savePublicImage(
  file: File,
  folder: string,
  options?: { compress?: boolean }
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 25 * 1024 * 1024) throw new Error("Image trop lourde. Maximum 25 Mo.");
  const ext = imageExtension(file.name) || (file.type === "image/svg+xml" ? "" : "");
  if (!ext) throw new Error("Format accepté : JPG, PNG, WEBP ou TIFF.");
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");
  if (!safeFolder) throw new Error("Dossier image invalide.");
  const dir = path.join(process.cwd(), "storage", "uploads", safeFolder);
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());

  if (options?.compress && ext !== ".svg") {
    const filename = `${randomUUID()}.webp`;
    await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(dir, filename));
    return `/api/uploads/${safeFolder}/${filename}`;
  }

  const filename = `${randomUUID()}${ext}`;
  await writeFile(path.join(dir, filename), bytes);
  return `/api/uploads/${safeFolder}/${filename}`;
}

function albumDir(albumId: string): string {
  return path.join(process.cwd(), "storage", "albums", albumId);
}

export function originalPath(albumId: string, photoId: string, ext: string): string {
  return path.join(albumDir(albumId), "originals", `${photoId}${ext}`);
}

export function thumbPath(albumId: string, photoId: string): string {
  return path.join(albumDir(albumId), "thumbs", `${photoId}.webp`);
}

export function previewPath(albumId: string, photoId: string): string {
  return path.join(albumDir(albumId), "previews", `${photoId}.webp`);
}

async function writeDerivative(bytes: Buffer, dest: string, width: number, quality: number): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(dest);
}

/**
 * Écrit le fichier original tel quel, puis des aperçus légers pour l'affichage.
 * Le fichier d'origine n'est ni recompressé ni réenregistré.
 * @param albumId Album cible.
 * @param photoId Identifiant de la photo.
 * @param file Fichier envoyé par le photographe.
 */
export async function saveOriginalPhoto(
  albumId: string,
  photoId: string,
  file: File
): Promise<{ ext: string; bytes: number }> {
  if (file.size === 0) throw new Error("Fichier vide.");
  if (file.size > 40 * 1024 * 1024) throw new Error("Photo trop lourde. Maximum 40 Mo.");
  const ext = imageExtension(file.name);
  if (!ext) throw new Error("Format accepté : JPG, PNG, WEBP ou TIFF.");
  const bytes = Buffer.from(await file.arrayBuffer());
  const dest = originalPath(albumId, photoId, ext);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  await Promise.all([
    writeDerivative(bytes, thumbPath(albumId, photoId), 640, 70),
    writeDerivative(bytes, previewPath(albumId, photoId), 1600, 78),
  ]);
  return { ext, bytes: bytes.length };
}

export async function deletePhotoFiles(albumId: string, photoId: string, ext: string): Promise<void> {
  await Promise.all(
    [originalPath(albumId, photoId, ext), thumbPath(albumId, photoId), previewPath(albumId, photoId)].map((file) =>
      unlink(file).catch(() => undefined)
    )
  );
}

export function cvAbsolutePath(): string {
  const name = process.env.CV_FILE_NAME || "CV_Yohann_Armel_K.pdf";
  return path.join(process.cwd(), "storage", "cv", name);
}

export function contentTypeFor(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".tif" || ext === ".tiff") return "image/tiff";
  return "image/jpeg";
}
