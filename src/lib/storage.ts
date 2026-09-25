/**
 * Stockage images : R2 en production, disque local en secours.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v2
 */
import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
  isR2Configured,
  r2CvKey,
  r2Delete,
  r2DeletePrefix,
  r2OriginalKey,
  r2PreviewKey,
  r2Put,
  r2ThumbKey,
  r2UploadKey,
} from "@/lib/r2";

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

async function writeDerivativeBuffer(bytes: Buffer, width: number, quality: number): Promise<Buffer> {
  return sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();
}

async function writeDerivativeLocal(bytes: Buffer, dest: string, width: number, quality: number): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(bytes, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(dest);
}

/**
 * Enregistre un visuel public (création, service, formation, pack, mode).
 * @param file Fichier du formulaire.
 * @param folder Dossier logique.
 * @param options.compress Redimensionne à ~1200px en WebP.
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
  const bytes = Buffer.from(await file.arrayBuffer());

  let filename: string;
  let payload: Buffer;
  let contentType: string;

  if (options?.compress && ext !== ".svg") {
    filename = `${randomUUID()}.webp`;
    payload = await sharp(bytes, { failOn: "none" })
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    contentType = "image/webp";
  } else {
    filename = `${randomUUID()}${ext}`;
    payload = bytes;
    contentType = contentTypeFor(ext);
  }

  if (isR2Configured()) {
    await r2Put(r2UploadKey(safeFolder, filename), payload, contentType);
  } else {
    const dir = path.join(process.cwd(), "storage", "uploads", safeFolder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), payload);
  }

  return `/api/uploads/${safeFolder}/${filename}`;
}

/**
 * Écrit l'original tel quel + aperçus légers (R2 ou disque).
 * @param albumId Album cible.
 * @param photoId Identifiant de la photo.
 * @param file Fichier envoyé.
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
  const [thumb, preview] = await Promise.all([
    writeDerivativeBuffer(bytes, 640, 70),
    writeDerivativeBuffer(bytes, 1600, 78),
  ]);

  if (isR2Configured()) {
    await Promise.all([
      r2Put(r2OriginalKey(albumId, photoId, ext), bytes, contentTypeFor(ext)),
      r2Put(r2ThumbKey(albumId, photoId), thumb, "image/webp"),
      r2Put(r2PreviewKey(albumId, photoId), preview, "image/webp"),
    ]);
  } else {
    const dest = originalPath(albumId, photoId, ext);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);
    await Promise.all([
      writeDerivativeLocal(bytes, thumbPath(albumId, photoId), 640, 70),
      writeDerivativeLocal(bytes, previewPath(albumId, photoId), 1600, 78),
    ]);
  }

  return { ext, bytes: bytes.length };
}

/**
 * Supprime les fichiers d'une photo (R2 et/ou disque).
 */
export async function deletePhotoFiles(albumId: string, photoId: string, ext: string): Promise<void> {
  if (isR2Configured()) {
    await Promise.all([
      r2Delete(r2OriginalKey(albumId, photoId, ext)),
      r2Delete(r2ThumbKey(albumId, photoId)),
      r2Delete(r2PreviewKey(albumId, photoId)),
    ]);
  }
  await Promise.all(
    [originalPath(albumId, photoId, ext), thumbPath(albumId, photoId), previewPath(albumId, photoId)].map((file) =>
      unlink(file).catch(() => undefined)
    )
  );
}

/**
 * Supprime tous les fichiers d'un album (préfixe R2 + dossier local).
 * @param albumId Identifiant album.
 */
export async function deleteAlbumFiles(albumId: string): Promise<void> {
  if (isR2Configured()) {
    await r2DeletePrefix(`albums/${albumId}/`);
  }
}

export function cvAbsolutePath(fileName?: string): string {
  const name = fileName || process.env.CV_FILE_NAME || "CV_Yohann_Armel_K.pdf";
  return path.join(process.cwd(), "storage", "cv", name);
}

export function cvObjectKey(fileName?: string): string {
  const name = fileName || process.env.CV_FILE_NAME || "CV_Yohann_Armel_K.pdf";
  return r2CvKey(name);
}

/**
 * Enregistre un PDF de CV (R2 ou disque local).
 * @param file Fichier PDF du formulaire.
 * @returns Nom de fichier stocké.
 */
export async function saveCvPdf(file: File): Promise<string> {
  if (!file || file.size === 0) throw new Error("Fichier CV manquant.");
  if (file.size > 15 * 1024 * 1024) throw new Error("CV trop lourd. Maximum 15 Mo.");
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) throw new Error("Le CV doit être un fichier PDF.");
  const safeName =
    file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(0, 100) ||
    `CV_${randomUUID()}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isR2Configured()) {
    await r2Put(r2CvKey(safeName), bytes, "application/pdf");
  } else {
    const dir = path.join(process.cwd(), "storage", "cv");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, safeName), bytes);
  }
  return safeName;
}

export function contentTypeFor(ext: string): string {
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".svg") return "image/svg+xml";
  if (ext === ".tif" || ext === ".tiff") return "image/tiff";
  return "image/jpeg";
}

/**
 * Enregistre une icône de logiciel (SVG/PNG/JPG/WEBP, sans recompression).
 * @param file Fichier du formulaire.
 * @returns Chemin public via l'API, ou null si vide.
 */
export async function saveSoftwareIcon(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > 2 * 1024 * 1024) throw new Error("Icône trop lourde. Maximum 2 Mo.");
  let ext = path.extname(file.name).toLowerCase();
  if (file.type === "image/svg+xml") ext = ".svg";
  if (![".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    throw new Error("Format icône accepté : SVG, PNG, JPG ou WEBP.");
  }
  if (ext === ".jpeg") ext = ".jpg";
  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}${ext}`;
  const contentType = contentTypeFor(ext);

  if (isR2Configured()) {
    await r2Put(r2UploadKey("software", filename), bytes, contentType);
  } else {
    const dir = path.join(process.cwd(), "storage", "uploads", "software");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);
  }

  return `/api/uploads/software/${filename}`;
}
