/**
 * POST /api/visit — compte une page vue du site public.
 * Public par nature (visiteurs anonymes) : aucune donnée personnelle reçue ni stockée.
 * Non comptés : robots, back-office, administrateur connecté, appels d'une autre origine, site local.
 * Réponses : 204 (compté ou ignoré volontairement), 500 jamais exposé (erreur journalisée, 204 renvoyé).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { NextResponse, type NextRequest } from "next/server";
import { logError } from "@/lib/log";
import { isLocalUrl } from "@/lib/site-url";
import { isLikelyBot, isSameOrigin, isTrackablePath, secondsUntilUtcMidnight, utcDayKey } from "@/lib/visits";
import { recordVisit } from "@/server/visits";

const VISIT_COOKIE = "kya_visit";

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

/**
 * @param request Corps texte : chemin de la page visitée (ex. « / », « /galerie »).
 * @returns 204 dans tous les cas (le compteur ne doit jamais gêner la navigation).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const path = (await request.text().catch(() => "")).slice(0, 300).trim();
  const ignored =
    !isTrackablePath(path) ||
    isLikelyBot(request.headers.get("user-agent")) ||
    !isSameOrigin(request.headers.get("origin"), request.headers.get("host")) ||
    Boolean(request.cookies.get("kya_admin")?.value) ||
    isLocalUrl(request.url);
  if (ignored) return noContent();

  const now = new Date();
  const today = utcDayKey(now);
  const newVisitor = request.cookies.get(VISIT_COOKIE)?.value !== today;
  try {
    await recordVisit(now, newVisitor);
  } catch (error) {
    logError("visit.record", error);
    return noContent();
  }

  const response = noContent();
  if (newVisitor) {
    response.cookies.set(VISIT_COOKIE, today, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: secondsUntilUtcMidnight(now),
    });
  }
  return response;
}
