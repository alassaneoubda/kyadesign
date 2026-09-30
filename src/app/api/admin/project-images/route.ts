/**
 * POST /api/admin/project-images — reçoit UNE image de réalisation (couverture ou galerie).
 * Les images sont envoyées une par une pour rester sous la limite de 4,5 Mo par requête de Vercel ;
 * le formulaire n'envoie ensuite que les reçus signés (voir saveProjectAction).
 *
 * Réponses :
 * - 200 { success, data: { src, bytes, iat, sig } } — image contrôlée, recompressée et stockée
 * - 400 FILE_REQUIRED — aucun fichier
 * - 401 UNAUTHORIZED — pas de session administrateur
 * - 403 FORBIDDEN_ORIGIN — appel depuis un autre site
 * - 413 FILE_TOO_LARGE — image de plus de 4 Mo
 * - 422 IMAGE_FORMAT / IMAGE_SIZE / IMAGE_UNREADABLE — image refusée
 * - 502 STORAGE_UNAVAILABLE — stockage en ligne indisponible
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import { randomUUID } from "crypto";
import { apiError } from "@/lib/api-error";
import { getAdminSession } from "@/lib/auth";
import { logError, logInfo } from "@/lib/log";
import { ImageValidationError, savePublicImage } from "@/lib/storage";
import { MAX_IMAGE_REQUEST_BYTES } from "@/lib/upload-limits";
import { signUploadReceipt } from "@/lib/upload-receipt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMAGE_ERRORS: Record<ImageValidationError["code"], string> = {
  format: "IMAGE_FORMAT",
  size: "IMAGE_SIZE",
  unreadable: "IMAGE_UNREADABLE",
};

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Contrôle, recompresse (1200 px, WebP) et stocke une image, puis renvoie son reçu signé.
 * @param request Requête multipart avec le champ « file ».
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError(403, "FORBIDDEN_ORIGIN", "Origine non autorisée.");
  if (!(await getAdminSession())) return apiError(401, "UNAUTHORIZED", "Session expirée : reconnecte-toi.");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_IMAGE_REQUEST_BYTES + 64 * 1024) {
    return apiError(413, "FILE_TOO_LARGE", "Image trop lourde (4 Mo maximum par image).");
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return apiError(400, "FILE_REQUIRED", "Image manquante.");
  if (file.size > MAX_IMAGE_REQUEST_BYTES) {
    return apiError(413, "FILE_TOO_LARGE", "Image trop lourde (4 Mo maximum par image).");
  }

  try {
    const src = await savePublicImage(file, "creations", { compress: true });
    if (!src) return apiError(400, "FILE_REQUIRED", "Image manquante.");
    logInfo("project.image_upload", { bytes: String(file.size) });
    return Response.json({
      success: true,
      data: signUploadReceipt(src, file.size),
      timestamp: new Date().toISOString(),
      traceId: randomUUID(),
    });
  } catch (error) {
    if (error instanceof ImageValidationError) return apiError(422, IMAGE_ERRORS[error.code], error.message);
    logError("project.image_upload", error);
    return apiError(502, "STORAGE_UNAVAILABLE", "Stockage indisponible, réessaie dans un instant.");
  }
}
