import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

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
 * Vérifie l'identifiant administrateur lu depuis l'environnement.
 * Le mot de passe n'est jamais comparé en clair dans le code source.
 */
export async function credentialsMatch(email: string, password: string): Promise<boolean> {
  const expectedEmail = process.env.ADMIN_EMAIL ?? "";
  const hash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (!expectedEmail || !hash) return false;
  if (email.trim().toLowerCase() !== expectedEmail.trim().toLowerCase()) return false;
  return compare(password, hash);
}

export async function signAdminToken(email: string): Promise<string> {
  return signToken({ purpose: "admin", email }, 12);
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

export async function getAdminSession(): Promise<{ email: string } | null> {
  const payload = await readPayload(ADMIN_COOKIE, "admin");
  if (!payload || typeof payload.email !== "string") return null;
  return { email: payload.email };
}

export async function getGuestCode(): Promise<string | null> {
  const payload = await readPayload(GUEST_COOKIE, "guest");
  if (!payload || typeof payload.code !== "string") return null;
  return payload.code;
}

export const cookieNames = { admin: ADMIN_COOKIE, guest: GUEST_COOKIE };
