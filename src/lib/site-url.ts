/**
 * URL publique du site, normalisée depuis NEXT_PUBLIC_SITE_URL.
 */

const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Indique si l'URL pointe vers la machine locale (inutilisable dans un lien envoyé à un client).
 * @param url URL absolue.
 */
export function isLocalUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
  } catch {
    return true;
  }
}

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
