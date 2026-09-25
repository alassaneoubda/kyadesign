import { randomUUID } from "crypto";

/**
 * Journal métier sans mot de passe, sans code d'accès et sans donnée personnelle brute.
 * @param action Nom court de l'opération.
 * @param fields Contexte non sensible (identifiants techniques).
 * @returns traceId de corrélation.
 */
export function logInfo(action: string, fields: Record<string, string> = {}): string {
  const traceId = randomUUID();
  console.info(JSON.stringify({ level: "info", traceId, action, ...fields, at: new Date().toISOString() }));
  return traceId;
}

export function logError(action: string, error: unknown): string {
  const traceId = randomUUID();
  const message = error instanceof Error ? error.message : "Erreur inconnue";
  console.error(JSON.stringify({ level: "error", traceId, action, message, at: new Date().toISOString() }));
  return traceId;
}
