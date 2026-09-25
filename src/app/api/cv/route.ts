import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { apiError } from "@/lib/api-error";
import { logInfo } from "@/lib/log";
import { cvAbsolutePath } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Téléchargement public du CV (sans mot de passe).
 */
export async function GET() {
  const file = cvAbsolutePath();
  const info = await stat(file).catch(() => null);
  if (!info) return apiError(404, "NOT_FOUND", "Fichier CV introuvable.");
  logInfo("cv.download");
  const stream = createReadStream(file);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(info.size),
      "Content-Disposition": 'attachment; filename="CV_Yohann_Armel_K.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
