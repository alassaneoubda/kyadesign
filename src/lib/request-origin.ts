/**
 * Adresse publique à mettre dans les liens envoyés aux clients (côté serveur uniquement).
 */
import { headers } from "next/headers";
import { getSiteUrl, isLocalUrl } from "@/lib/site-url";

const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;

/**
 * NEXT_PUBLIC_SITE_URL si c'est un vrai domaine ; sinon l'adresse par laquelle
 * la page est consultée (domaine Vercel en ligne, IP du réseau local en test).
 * @returns Origine absolue sans slash final.
 */
export async function getPublicOrigin(): Promise<string> {
  const configured = getSiteUrl();
  if (!isLocalUrl(configured)) return configured;
  const store = await headers();
  const host = (store.get("x-forwarded-host") ?? store.get("host") ?? "").split(",")[0].trim();
  if (!HOST_PATTERN.test(host)) return configured;
  const forwardedProto = store.get("x-forwarded-proto")?.split(",")[0].trim();
  const proto = forwardedProto === "http" || forwardedProto === "https"
    ? forwardedProto
    : isLocalUrl(`http://${host}`) ? "http" : "https";
  return `${proto}://${host}`;
}
