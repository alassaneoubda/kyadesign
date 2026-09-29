/**
 * Compteur de visites — accès base de données.
 * Incrément atomique (INSERT … ON CONFLICT) : aucune perte de comptage sous accès concurrents.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { prisma } from "@/lib/prisma";
import { buildDailySeries, sumLastDays, trendPercent, utcDayKey, type VisitPoint, type VisitTotals } from "@/lib/visits";

export type VisitStats = {
  today: VisitTotals;
  last7: VisitTotals;
  last30: VisitTotals;
  allTime: VisitTotals;
  trend7: number | null;
  series: VisitPoint[];
};

const SERIES_DAYS = 30;
const DAY_MS = 86_400_000;

/**
 * Compte une page vue pour aujourd'hui (et un visiteur si c'est sa première page du jour).
 * @param now Instant de la visite.
 * @param newVisitor Vrai si le visiteur n'a pas encore été compté aujourd'hui.
 */
export async function recordVisit(now: Date, newVisitor: boolean): Promise<void> {
  const day = utcDayKey(now);
  const visitors = newVisitor ? 1 : 0;
  await prisma.$executeRaw`
    INSERT INTO "VisitDay" ("day", "views", "visitors", "createdAt", "updatedAt")
    VALUES (${day}::date, 1, ${visitors}, NOW(), NOW())
    ON CONFLICT ("day") DO UPDATE SET
      "views" = "VisitDay"."views" + 1,
      "visitors" = "VisitDay"."visitors" + EXCLUDED."visitors",
      "updatedAt" = NOW()`;
}

/**
 * Statistiques d'audience pour le tableau de bord.
 * @param now Jour de référence.
 * @returns Totaux (aujourd'hui, 7 j, 30 j, depuis le début), tendance 7 j et série 30 j.
 */
export async function getVisitStats(now: Date = new Date()): Promise<VisitStats> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (SERIES_DAYS * 2 - 1) * DAY_MS);
  const [rows, all] = await Promise.all([
    prisma.visitDay.findMany({ where: { day: { gte: start } }, orderBy: { day: "asc" }, take: SERIES_DAYS * 2 }),
    prisma.visitDay.aggregate({ _sum: { views: true, visitors: true } }),
  ]);
  const extended = buildDailySeries(rows, SERIES_DAYS * 2, now);
  const series = extended.slice(-SERIES_DAYS);
  const last7 = sumLastDays(series, 7);
  const previous7 = sumLastDays(extended.slice(0, -7), 7);
  return {
    today: sumLastDays(series, 1),
    last7,
    last30: sumLastDays(series, SERIES_DAYS),
    allTime: { views: all._sum.views ?? 0, visitors: all._sum.visitors ?? 0 },
    trend7: trendPercent(last7.visitors, previous7.visitors),
    series,
  };
}
