import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

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
