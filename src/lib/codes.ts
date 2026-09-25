import { randomInt } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Normalise un code d'accès saisi par un invité.
 * @param code Valeur brute du formulaire.
 * @returns Code en majuscules, sans espaces.
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Génère un code du type KYA-8F42-91, sans caractères ambigus.
 * @returns Code unique à enregistrer sur un album.
 */
export function createAccessCode(): string {
  const chunk = (length: number): string => {
    let value = "";
    for (let index = 0; index < length; index += 1) {
      value += ALPHABET[randomInt(ALPHABET.length)];
    }
    return value;
  };
  return `KYA-${chunk(4)}-${chunk(2)}`;
}

/**
 * Vérifie le format d'un code avant enregistrement.
 * @param code Code déjà normalisé.
 */
export function isAccessCode(code: string): boolean {
  return /^KYA-[A-Z2-9]{4}-[A-Z2-9]{2}$/.test(code);
}
