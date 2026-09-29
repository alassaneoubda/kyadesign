/**
 * Compteur de visites — fonctions pures (sans base de données) : filtrage des robots,
 * clés de jour UTC, séries quotidiennes et totaux pour le tableau de bord.
 * Auteur : Kya Design — 2026-09-29 — v1
 */

export type VisitRow = { day: Date; views: number; visitors: number };
export type VisitPoint = { key: string; views: number; visitors: number };
export type VisitTotals = { views: number; visitors: number };

const DAY_MS = 86_400_000;

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp|telegram|curl|wget|python|axios|node-fetch|go-http|java\//i;

/**
 * Clé de jour UTC (heure d'Abidjan), ex. « 2026-09-29 ».
 * @param date Instant à convertir.
 * @returns Date au format AAAA-MM-JJ.
 */
export function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Secondes restantes avant minuit UTC : durée de vie du cookie « déjà compté aujourd'hui ».
 * @param now Instant courant.
 * @returns Nombre de secondes (au moins 60).
 */
export function secondsUntilUtcMidnight(now: Date): number {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return Math.max(60, Math.ceil((midnight - now.getTime()) / 1000));
}

/**
 * Détecte les robots, aperçus de liens et outils automatiques (non comptés).
 * @param userAgent En-tête User-Agent (absent = robot).
 * @returns Vrai si la requête ne doit pas être comptée.
 */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const value = userAgent?.trim() ?? "";
  return value.length < 12 || BOT_PATTERN.test(value);
}

/**
 * Seules les pages publiques sont comptées (ni back-office, ni API).
 * @param path Chemin de la page visitée.
 * @returns Vrai si la page doit être comptée.
 */
export function isTrackablePath(path: string | null | undefined): boolean {
  if (!path || !path.startsWith("/") || path.length > 300) return false;
  return !path.startsWith("/admin") && !path.startsWith("/api");
}

/**
 * Vérifie que l'appel vient bien du site lui-même (limite le gonflage artificiel du compteur).
 * @param origin En-tête Origin de la requête.
 * @param host En-tête Host de la requête.
 * @returns Vrai si l'origine correspond à l'hôte.
 */
export function isSameOrigin(origin: string | null, host: string | null): boolean {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Série quotidienne continue (jours sans visite = 0), du plus ancien au plus récent.
 * @param rows Lignes lues en base.
 * @param days Nombre de jours souhaités (aujourd'hui inclus).
 * @param today Jour de référence.
 * @returns Un point par jour.
 */
export function buildDailySeries(rows: VisitRow[], days: number, today: Date): VisitPoint[] {
  const byDay = new Map(rows.map((row) => [utcDayKey(row.day), row]));
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: Math.max(0, days) }, (_, index) => {
    const key = utcDayKey(new Date(end - (days - 1 - index) * DAY_MS));
    const row = byDay.get(key);
    return { key, views: row?.views ?? 0, visitors: row?.visitors ?? 0 };
  });
}

/**
 * Totaux des derniers jours d'une série.
 * @param series Série quotidienne (plus récent en dernier).
 * @param lastDays Nombre de jours à additionner depuis la fin.
 * @returns Pages vues et visites cumulées.
 */
export function sumLastDays(series: VisitPoint[], lastDays: number): VisitTotals {
  return series.slice(-lastDays).reduce(
    (total, point) => ({ views: total.views + point.views, visitors: total.visitors + point.visitors }),
    { views: 0, visitors: 0 }
  );
}

/**
 * Évolution en % entre deux périodes, arrondie ; null si la période précédente est vide.
 * @param current Valeur de la période courante.
 * @param previous Valeur de la période précédente.
 * @returns Pourcentage signé ou null.
 */
export function trendPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
