import archiver from "archiver";
import { randomUUID } from "crypto";
import { PassThrough, Readable } from "stream";
import { z } from "zod";
import { canReadAlbum } from "@/lib/album-access";
import { apiError } from "@/lib/api-error";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { originalPath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  albumId: z.string().min(4),
  photoIds: z.array(z.string().min(4)).min(1).max(400),
});

function zipName(original: string, index: number): string {
  const clean = original.replace(/[^\w.\- ()]/g, "_").slice(0, 80) || "photo.jpg";
  return `${String(index + 1).padStart(3, "0")}-${clean}`;
}

/**
 * Zip des originaux, sans recompression des images (mode STORE).
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return apiError(400, "INVALID", "Sélection invalide.");
  const { albumId, photoIds } = parsed.data;
  if (!(await canReadAlbum(albumId))) return apiError(401, "UNAUTHORIZED", "Code requis.");

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album || !album.published) return apiError(404, "NOT_FOUND", "Album introuvable.");
  if (photoIds.length > album.maxPhotos) {
    return apiError(422, "LIMIT", `Tu peux télécharger ${album.maxPhotos} photos au maximum.`);
  }

  const photos = await prisma.albumPhoto.findMany({
    where: { albumId, id: { in: photoIds } },
    orderBy: { sortOrder: "asc" },
  });
  if (photos.length !== photoIds.length) return apiError(403, "FORBIDDEN", "Photo hors album.");

  const pass = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 0 } });
  archive.on("error", (error) => pass.destroy(error));
  archive.pipe(pass);
  photos.forEach((photo, index) => {
    archive.file(originalPath(photo.albumId, photo.id, photo.ext), {
      name: zipName(photo.originalName, index),
    });
  });
  void archive.finalize();
  logInfo("album.download", { albumId, count: String(photos.length) });

  const filename = `${album.title.replace(/[^\w\- ]/g, "").trim().replace(/\s+/g, "_") || "album"}.zip`;
  return new Response(Readable.toWeb(pass) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
      "X-Trace-Id": randomUUID(),
    },
  });
}
