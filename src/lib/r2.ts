/**
 * Client S3-compatible pour Cloudflare R2.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v1
 */
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

let client: S3Client | null = null;

/**
 * @returns true si toutes les variables R2 sont présentes.
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET
  );
}

function requireBucket(): string {
  const bucket = process.env.R2_BUCKET;
  if (!bucket) throw new Error("R2_BUCKET manquant.");
  return bucket;
}

function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error("Configuration R2 incomplète.");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return client;
}

/** Clés objets album. */
export function r2OriginalKey(albumId: string, photoId: string, ext: string): string {
  return `albums/${albumId}/originals/${photoId}${ext}`;
}

export function r2ThumbKey(albumId: string, photoId: string): string {
  return `albums/${albumId}/thumbs/${photoId}.webp`;
}

export function r2PreviewKey(albumId: string, photoId: string): string {
  return `albums/${albumId}/previews/${photoId}.webp`;
}

export function r2UploadKey(folder: string, filename: string): string {
  return `uploads/${folder}/${filename}`;
}

export function r2CvKey(filename: string): string {
  return `cv/${filename}`;
}

/**
 * Écrit un objet binaire dans R2.
 * @param key Chemin objet.
 * @param body Contenu.
 * @param contentType Type MIME.
 */
export async function r2Put(key: string, body: Buffer, contentType: string): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: requireBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

/**
 * Lit un objet R2.
 * @param key Chemin objet.
 * @returns Corps + métadonnées, ou null si absent.
 */
export async function r2Get(
  key: string
): Promise<{ body: Readable; contentLength?: number; contentType?: string } | null> {
  try {
    const result = await getClient().send(
      new GetObjectCommand({ Bucket: requireBucket(), Key: key })
    );
    if (!result.Body) return null;
    const body = result.Body as Readable;
    return {
      body,
      contentLength: result.ContentLength,
      contentType: result.ContentType ?? undefined,
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
    if (status === 404) return null;
    throw error;
  }
}

/**
 * Télécharge un objet R2 en mémoire (zip, etc.).
 * @param key Chemin objet.
 */
export async function r2GetBuffer(key: string): Promise<Buffer | null> {
  const obj = await r2Get(key);
  if (!obj) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of obj.body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Supprime un objet R2 (ignore l'absence).
 * @param key Chemin objet.
 */
export async function r2Delete(key: string): Promise<void> {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: requireBucket(), Key: key }));
  } catch {
    // Fichier déjà absent
  }
}

/**
 * Supprime tous les objets sous un préfixe (ex. un album entier).
 * @param prefix Préfixe R2.
 */
export async function r2DeletePrefix(prefix: string): Promise<void> {
  const bucket = requireBucket();
  let token: string | undefined;
  do {
    const listed = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    const keys = (listed.Contents ?? [])
      .map((item) => item.Key)
      .filter((key): key is string => Boolean(key));
    if (keys.length) {
      await getClient().send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys.map((Key) => ({ Key })) },
        })
      );
    }
    token = listed.IsTruncated ? listed.NextContinuationToken : undefined;
  } while (token);
}
