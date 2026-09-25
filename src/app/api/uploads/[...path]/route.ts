import { apiError } from "@/lib/api-error";
import { streamPublicUpload } from "@/lib/stream-file";

/**
 * Sert une image uploadée (R2 ou storage/uploads).
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
  return streamPublicUpload(parts);
}
