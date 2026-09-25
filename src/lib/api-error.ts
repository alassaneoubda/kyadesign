import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

/**
 * Réponse d'erreur API au format uniforme du projet.
 * @param status Code HTTP.
 * @param code Code métier stable.
 * @param message Message lisible.
 */
export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json(
    { success: false, code, message, timestamp: new Date().toISOString(), traceId: randomUUID() },
    { status }
  );
}
