/**
 * URL publique du site, normalisée depuis NEXT_PUBLIC_SITE_URL.
 */

const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Retourne l'URL du site avec protocole et sans slash final.
 * Tolère une valeur saisie sans protocole (ex. "kyadesign.vercel.app").
 * @returns URL absolue exploitable par `new URL()`.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (!raw) return FALLBACK_SITE_URL;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return FALLBACK_SITE_URL;
  }
}
