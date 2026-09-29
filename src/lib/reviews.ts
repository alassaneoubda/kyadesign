/**
 * Avis laissés par les visiteurs — règles pures (sans base de données) :
 * détection des robots (champ piège, envoi trop rapide) et refus des liens (spam).
 * Auteur : Kya Design — 2026-09-29 — v1
 */

/** Temps minimal (ms) entre l'ouverture du formulaire et l'envoi : en dessous, c'est un robot. */
export const MIN_FILL_MS = 3_000;

/** Au-delà, le formulaire est considéré comme périmé (horodatage suspect ou page restée ouverte des jours). */
export const MAX_FILL_MS = 24 * 60 * 60 * 1_000;

/** Nombre maximal d'avis visiteurs acceptés par heure, tous visiteurs confondus. */
export const MAX_REVIEWS_PER_HOUR = 10;

/** Nombre maximal d'avis en attente de validation (évite de remplir la base en cas d'attaque). */
export const MAX_PENDING_REVIEWS = 50;

const LINK_PATTERN = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|info|ru|xyz|io|biz|top|click|link)\b)/i;

/**
 * Indique si l'envoi a toutes les caractéristiques d'un robot.
 * @param honeypot Valeur du champ piège (invisible pour un humain, rempli par les robots).
 * @param openedAt Horodatage (ms) de l'ouverture du formulaire, envoyé par le navigateur.
 * @param now Instant de réception (ms).
 * @returns Vrai si l'avis doit être ignoré silencieusement.
 */
export function isLikelySpamSubmission(honeypot: string, openedAt: number, now: number): boolean {
  if (honeypot.trim() !== "") return true;
  if (!Number.isFinite(openedAt) || openedAt <= 0) return true;
  const elapsed = now - openedAt;
  return elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS;
}

/**
 * Détecte la présence d'un lien : un avis client n'en a pas besoin, les spams presque toujours.
 * @param text Texte à analyser.
 * @returns Vrai si un lien ou un nom de domaine est présent.
 */
export function containsLink(text: string): boolean {
  return LINK_PATTERN.test(text);
}
