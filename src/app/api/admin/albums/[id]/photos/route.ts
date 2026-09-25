import { randomUUID } from "crypto";
import { getAdminSession } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { logError, logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { saveOriginalPhoto } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reçoit une photo à la fois pour garder l'envoi rapide et fiable,
 * même quand l'album contient 100 à 200 fichiers.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/albums/[id]/photos">) {
  const admin = await getAdminSession();
  if (!admin) return apiError(401, "UNAUTHORIZED", "Connexion requise.");
  const { id } = await ctx.params;
  const album = await prisma.album.findUnique({ where: { id }, select: { id: true, cover: true } });
  if (!album) return apiError(404, "NOT_FOUND", "Album introuvable.");

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return apiError(400, "FILE_REQUIRED", "Photo manquante.");

  const count = await prisma.albumPhoto.count({ where: { albumId: id } });
  if (count >= 400) return apiError(422, "LIMIT", "Maximum 400 photos par album.");

  const photoId = randomUUID();
  try {
    const saved = await saveOriginalPhoto(id, photoId, file);
    await prisma.albumPhoto.create({
      data: {
        id: photoId,
        albumId: id,
        originalName: file.name.slice(0, 180),
        ext: saved.ext,
        bytes: saved.bytes,
        sortOrder: count,
      },
    });
    if (!album.cover) {
      await prisma.album.update({ where: { id }, data: { cover: photoId } });
    }
    logInfo("album.photo", { albumId: id });
    return Response.json({
      success: true,
      data: { id: photoId },
      timestamp: new Date().toISOString(),
      traceId: randomUUID(),
    });
  } catch (error) {
    logError("album.photo", error);
    const message = error instanceof Error ? error.message : "Envoi impossible.";
    return apiError(400, "UPLOAD_FAILED", message);
  }
}
