import { canReadAlbum } from "@/lib/album-access";
import { apiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { contentTypeFor, originalPath, previewPath, thumbPath } from "@/lib/storage";
import { streamFile } from "@/lib/stream-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadPhoto(photoId: string) {
  const photo = await prisma.albumPhoto.findUnique({ where: { id: photoId } });
  if (!photo) return { error: apiError(404, "NOT_FOUND", "Photo introuvable.") };
  if (!(await canReadAlbum(photo.albumId))) return { error: apiError(401, "UNAUTHORIZED", "Code requis.") };
  return { photo };
}

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[photoId]/[variant]">) {
  const { photoId, variant } = await ctx.params;
  const loaded = await loadPhoto(photoId);
  if ("error" in loaded && loaded.error) return loaded.error;
  const photo = loaded.photo;
  if (!photo) return apiError(404, "NOT_FOUND", "Photo introuvable.");

  if (variant === "thumb") {
    return streamFile(thumbPath(photo.albumId, photo.id), "image/webp", `${photo.id}.webp`, "inline");
  }
  if (variant === "preview") {
    return streamFile(previewPath(photo.albumId, photo.id), "image/webp", `${photo.id}.webp`, "inline");
  }
  if (variant === "original") {
    return streamFile(
      originalPath(photo.albumId, photo.id, photo.ext),
      contentTypeFor(photo.ext),
      photo.originalName,
      "attachment"
    );
  }
  return apiError(404, "NOT_FOUND", "Variante inconnue.");
}
