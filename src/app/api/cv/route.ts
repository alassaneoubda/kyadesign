import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { apiError } from "@/lib/api-error";
import { logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { isR2Configured } from "@/lib/r2";
import { cvAbsolutePath, cvObjectKey } from "@/lib/storage";
import { streamR2Object } from "@/lib/stream-file";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Téléchargement public du CV (R2 puis disque local).
 */
export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { id: 1 },
    select: { cvFileName: true },
  });
  const fileName = setting?.cvFileName || process.env.CV_FILE_NAME || "CV_Yohann_Armel_K.pdf";

  if (isR2Configured()) {
    const fromR2 = await streamR2Object(
      cvObjectKey(fileName),
      "application/pdf",
      fileName,
      "attachment",
      "public, max-age=3600"
    );
    if (fromR2) {
      logInfo("cv.download");
      return fromR2;
    }
  }

  const file = cvAbsolutePath(fileName);
  const info = await stat(file).catch(() => null);
  if (!info) return apiError(404, "NOT_FOUND", "Fichier CV introuvable.");
  logInfo("cv.download");
  const stream = createReadStream(file);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(info.size),
      "Content-Disposition": `attachment; filename="${fileName.replace(/"/g, "")}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
