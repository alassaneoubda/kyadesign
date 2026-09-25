import { prisma } from "@/lib/prisma";
import { getAdminSession, getGuestCode } from "@/lib/auth";
import { normalizeCode } from "@/lib/codes";

/**
 * Autorise le photographe connecté, ou l'invité dont le code correspond à l'album.
 * @param albumId Album demandé.
 * @returns Vrai si l'accès est permis.
 */
export async function canReadAlbum(albumId: string): Promise<boolean> {
  const admin = await getAdminSession();
  if (admin) return true;
  const code = await getGuestCode();
  if (!code) return false;
  const album = await prisma.album.findFirst({
    where: { id: albumId, published: true, accessCode: normalizeCode(code) },
    select: { id: true },
  });
  return Boolean(album);
}
