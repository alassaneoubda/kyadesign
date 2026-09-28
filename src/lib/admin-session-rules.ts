/**
 * Règle de validité d'une session admin, sans dépendance à la base (testable seule).
 */

export type ActiveCredentials = { email: string; version: number };

/**
 * Une session n'est valide que si elle a été ouverte avec les accès actuels.
 * Les jetons sans version (émis avant cette règle) valent version 0, celle des accès
 * venant des variables d'environnement : ils restent donc valides jusqu'au premier changement.
 * @param tokenEmail E-mail contenu dans le jeton.
 * @param tokenVersion Version contenue dans le jeton (absente sur les anciens jetons).
 * @param credentials Accès actuellement actifs, ou null si aucun n'est configuré.
 * @returns Vrai si la session doit être acceptée.
 */
export function sessionMatchesCredentials(
  tokenEmail: string,
  tokenVersion: string | undefined,
  credentials: ActiveCredentials | null
): boolean {
  if (!credentials) return false;
  if (tokenEmail.toLowerCase() !== credentials.email) return false;
  return (tokenVersion ?? "0") === String(credentials.version);
}
