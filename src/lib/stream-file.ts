/**
 * Streaming fichiers locaux ou R2.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v2
 */
import { createReadStream } from "fs";
import { access, constants, stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { apiError } from "@/lib/api-error";
import { isR2Configured, r2Get, r2UploadKey } from "@/lib/r2";

/**
 * Envoie un fichier local sans le modifier.
 * @param abs Chemin absolu.
 * @param type Type MIME.
 * @param filename Nom proposé au téléchargement.
 * @param disposition inline pour l'aperçu, attachment pour l'original.
 */
export async function streamFile(
  abs: string,
  type: string,
  filename: string,
  disposition: "inline" | "attachment"
): Promise<Response> {
  const info = await stat(abs);
  const node = createReadStream(abs);
  const encoded = encodeURIComponent(filename);
  return new Response(Readable.toWeb(node) as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(info.size),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/**
 * Sert un objet R2 en flux HTTP.
 * @param key Clé R2.
 * @param type Type MIME de secours.
 * @param filename Nom fichier.
 * @param disposition Disposition HTTP.
 * @param cacheControl Cache-Control.
 */
export async function streamR2Object(
  key: string,
  type: string,
  filename: string,
  disposition: "inline" | "attachment",
  cacheControl = "private, max-age=86400"
): Promise<Response | null> {
  const obj = await r2Get(key);
  if (!obj) return null;
  const encoded = encodeURIComponent(filename);
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || type,
    "Content-Disposition": `${disposition}; filename*=UTF-8''${encoded}`,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
  };
  if (obj.contentLength != null) headers["Content-Length"] = String(obj.contentLength);
  return new Response(Readable.toWeb(obj.body) as ReadableStream, { headers });
}

/**
 * Sert une image publique : R2 puis disque local / legacy public.
 * @param parts Segments de chemin sous uploads/.
 */
export async function streamPublicUpload(parts: string[]): Promise<Response> {
  const relative = parts.join("/");
  const filename = path.basename(relative);
  const ext = path.extname(filename).toLowerCase();
  const mime: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".svg": "image/svg+xml",
  };
  const type = mime[ext] ?? "application/octet-stream";

  if (isR2Configured()) {
    const fromR2 = await streamR2Object(
      r2UploadKey(parts[0], parts.slice(1).join("/")),
      type,
      filename,
      "inline",
      "public, max-age=86400"
    );
    if (fromR2) return fromR2;
  }

  const root = path.join(process.cwd(), "storage", "uploads");
  const abs = path.join(root, ...parts);
  if (!abs.startsWith(root)) return apiError(400, "INVALID", "Chemin invalide.");

  try {
    await access(abs, constants.R_OK);
    const node = createReadStream(abs);
    return new Response(Readable.toWeb(node) as ReadableStream, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    const legacy = path.join(process.cwd(), "public", "uploads", ...parts);
    try {
      await access(legacy, constants.R_OK);
      const node = createReadStream(legacy);
      return new Response(Readable.toWeb(node) as ReadableStream, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch {
      return apiError(404, "NOT_FOUND", "Image introuvable.");
    }
  }
}
