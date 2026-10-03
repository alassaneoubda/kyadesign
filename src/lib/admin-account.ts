/**
 * Source des identifiants back-office : base de données, sinon variables d'environnement.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-28 — v1
 */
import { Prisma } from "@prisma/client";
import { normalizeEnvPasswordHash } from "@/lib/admin-session-rules";
import { prisma } from "@/lib/prisma";

export const ADMIN_ACCOUNT_ID = 1;

export type AdminCredentials = {
  source: "db" | "env";
  email: string;
  passwordHash: string;
  /** Incrémentée à chaque changement : invalide les sessions ouvertes avec les anciens accès. */
  version: number;
};

function isMissingTable(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

/**
 * Lit les accès enregistrés depuis le back-office.
 * @returns La ligne AdminAccount, ou null si elle n'existe pas encore (ou si la table n'est pas créée).
 * @throws Erreur Prisma autre que « table absente » (base injoignable, etc.).
 */
async function readStoredAccount() {
  try {
    return await prisma.adminAccount.findUnique({ where: { id: ADMIN_ACCOUNT_ID } });
  } catch (error) {
    if (isMissingTable(error)) return null;
    throw error;
  }
}

/**
 * Identifiants à utiliser pour la connexion admin.
 * Priorité à la base ; repli sur ADMIN_EMAIL / ADMIN_PASSWORD_HASH tant que rien n'a été changé.
 * @returns Les identifiants actifs, ou null si aucun n'est configuré.
 */
export async function getAdminCredentials(): Promise<AdminCredentials | null> {
  const stored = await readStoredAccount();
  if (stored) {
    return { source: "db", email: stored.email, passwordHash: stored.passwordHash, version: stored.version };
  }
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const passwordHash = normalizeEnvPasswordHash(process.env.ADMIN_PASSWORD_HASH);
  if (!email || !passwordHash) return null;
  return { source: "env", email, passwordHash, version: 0 };
}

/**
 * Enregistre de nouveaux accès, avec verrou optimiste sur la version lue.
 * @param current Identifiants lus avant la modification.
 * @param next Nouvel e-mail (normalisé) et nouveau hash bcrypt.
 * @returns La nouvelle version, ou null si les accès ont changé entre-temps (conflit).
 */
export async function saveAdminCredentials(
  current: AdminCredentials,
  next: { email: string; passwordHash: string }
): Promise<number | null> {
  if (current.source === "db") {
    const result = await prisma.adminAccount.updateMany({
      where: { id: ADMIN_ACCOUNT_ID, version: current.version },
      data: { email: next.email, passwordHash: next.passwordHash, version: { increment: 1 } },
    });
    return result.count === 1 ? current.version + 1 : null;
  }
  try {
    const created = await prisma.adminAccount.create({
      data: { id: ADMIN_ACCOUNT_ID, email: next.email, passwordHash: next.passwordHash, version: 1 },
    });
    return created.version;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return null;
    throw error;
  }
}
