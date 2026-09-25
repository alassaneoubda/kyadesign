import { createReadStream } from "fs";
import { access, constants } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { apiError } from "@/lib/api-error";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".svg": "image/svg+xml",
};

/**
 * Sert une image uploadée depuis storage/uploads.
 * Contourne la limitation de Next : les fichiers ajoutés dans /public après le build
 * ne sont pas exposés par `next start`.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/uploads/[...path]">
) {
  const { path: parts } = await context.params;
  if (!parts?.length || parts.some((part) => part.includes("..") || part.includes("\\") || part.includes("\0"))) {
    return apiError(400, "INVALID", "Chemin invalide.");
  }

  const relative = parts.join("/");
  const root = path.join(process.cwd(), "storage", "uploads");
  const abs = path.join(root, ...parts);
  if (!abs.startsWith(root)) return apiError(400, "INVALID", "Chemin invalide.");

  try {
    await access(abs, constants.R_OK);
  } catch {
    // Compat : anciennes images encore dans public/uploads
    const legacy = path.join(process.cwd(), "public", "uploads", ...parts);
    try {
      await access(legacy, constants.R_OK);
      return streamImage(legacy, path.basename(legacy));
    } catch {
      return apiError(404, "NOT_FOUND", "Image introuvable.");
    }
  }

  return streamImage(abs, path.basename(relative));
}

function streamImage(abs: string, filename: string): Response {
  const ext = path.extname(filename).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  const node = createReadStream(abs);
  return new Response(Readable.toWeb(node) as ReadableStream, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
