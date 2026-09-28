import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAdminCredentials, type AdminCredentials } from "@/lib/admin-account";
import { sessionMatchesCredentials } from "@/lib/admin-session-rules";
import { logError } from "@/lib/log";

const ADMIN_COOKIE = "kya_admin";
const GUEST_COOKIE = "kya_guest";

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET manquant ou trop court (32 caractères minimum).");
  }
  return new TextEncoder().encode(secret);
}

async function signToken(payload: Record<string, string>, hours: number): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(secretKey());
}

/**
 * Vérifie les identifiants administrateur (base de données, sinon variables d'environnement).
 * Le mot de passe n'est jamais comparé en clair : uniquement via bcrypt.
 * @param email E-mail saisi.
 * @param password Mot de passe saisi.
 * @returns Les identifiants actifs si la saisie est correcte, sinon null.
 * @throws Erreur de base de données si les accès ne peuvent pas être lus.
 */
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminCredentials | null> {
  const credentials = await getAdminCredentials();
  if (!credentials) return null;
  if (email.trim().toLowerCase() !== credentials.email) return null;
  return (await compare(password, credentials.passwordHash)) ? credentials : null;
}

/**
 * Signe la session admin. La version permet d'invalider les sessions après un changement d'accès.
 * @param credentials Identifiants actifs au moment de la connexion.
 */
export async function signAdminToken(credentials: Pick<AdminCredentials, "email" | "version">): Promise<string> {
  return signToken({ purpose: "admin", email: credentials.email, v: String(credentials.version) }, 12);
}

export async function signGuestToken(code: string): Promise<string> {
  return signToken({ purpose: "guest", code }, 12);
}

async function readPayload(cookieName: string, purpose: string): Promise<Record<string, unknown> | null> {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.purpose !== purpose) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Session admin valide uniquement si elle correspond aux accès actuels :
 * changer l'e-mail ou le mot de passe déconnecte les autres appareils.
 * Les jetons émis avant l'ajout de la version (sans `v`) restent valides tant que les accès
 * proviennent encore des variables d'environnement.
 * @returns E-mail de l'admin connecté, ou null.
 */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const payload = await readPayload(ADMIN_COOKIE, "admin");
  if (!payload || typeof payload.email !== "string") return null;
  let credentials: AdminCredentials | null;
  try {
    credentials = await getAdminCredentials();
  } catch (error) {
    logError("admin.session_check", error);
    return null;
  }
  const tokenVersion = typeof payload.v === "string" ? payload.v : undefined;
  if (!credentials || !sessionMatchesCredentials(payload.email, tokenVersion, credentials)) return null;
  return { email: credentials.email };
}

export async function getGuestCode(): Promise<string | null> {
  const payload = await readPayload(GUEST_COOKIE, "guest");
  if (!payload || typeof payload.code !== "string") return null;
  return payload.code;
}

export const cookieNames = { admin: ADMIN_COOKIE, guest: GUEST_COOKIE };
