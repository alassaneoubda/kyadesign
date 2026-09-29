/**
 * Catalogue des réseaux sociaux proposés dans le back-office.
 * Fonctions pures (sans JSX ni base de données) : partagées par la validation serveur,
 * le back-office et le site public.
 * Auteur : Kya Design — 2026-09-29 — v1
 */

export const SOCIAL_PLATFORMS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "facebook", label: "Facebook" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "behance", label: "Behance" },
  { id: "youtube", label: "YouTube" },
  { id: "x", label: "X (Twitter)" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "pinterest", label: "Pinterest" },
  { id: "dribbble", label: "Dribbble" },
  { id: "threads", label: "Threads" },
  { id: "snapchat", label: "Snapchat" },
  { id: "telegram", label: "Telegram" },
  { id: "website", label: "Site web / autre lien" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["id"];

/**
 * Indique si l'identifiant correspond à un réseau du catalogue.
 * @param value Valeur reçue du formulaire.
 * @returns Vrai si le réseau est connu.
 */
export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORMS.some((platform) => platform.id === value);
}

/**
 * Nom lisible d'un réseau du catalogue.
 * @param platform Identifiant du réseau.
 * @returns Libellé, ou « Lien » si le réseau est inconnu.
 */
export function platformLabel(platform: string): string {
  if (platform === "website") return "Site web";
  return SOCIAL_PLATFORMS.find((item) => item.id === platform)?.label ?? "Lien";
}

/**
 * Nom affiché pour un lien : le libellé saisi, sinon le nom du réseau.
 * @param link Réseau enregistré.
 * @returns Nom à afficher (jamais vide).
 */
export function socialDisplayName(link: { platform: string; label: string }): string {
  return link.label.trim() || platformLabel(link.platform);
}

/**
 * N'accepte que des liens web absolus (http/https) : bloque javascript:, data:, etc.
 * @param value URL saisie.
 * @returns Vrai si le lien peut être publié sur le site.
 */
export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}
