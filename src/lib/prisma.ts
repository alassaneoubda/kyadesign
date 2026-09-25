/**
 * Client Prisma via adaptateur pg (SSL Supabase / Node 24).
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v3
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

/**
 * Prépare l'URL Postgres pour le driver pg sous Node 24+.
 * `sslmode=require` est désormais assimilé à verify-full : on force no-verify
 * (chiffrement conservé, sans validation CA locale manquante).
 * @param url Chaîne DATABASE_URL.
 */
function connectionString(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL manquant.");
  const cleaned = url
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/[?&]uselibpqcompat=[^&]*/gi, "")
    .replace(/\?&/g, "?")
    .replace(/[?&]$/g, "");
  const sep = cleaned.includes("?") ? "&" : "?";
  // Compat libpq : chiffrement SSL sans exiger le trust store local (Node 24 / Windows).
  return `${cleaned}${sep}uselibpqcompat=true&sslmode=require`;
}

function createPool(): Pool {
  const config: PoolConfig = {
    connectionString: connectionString(process.env.DATABASE_URL),
    ssl: { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 15000,
  };
  return new Pool(config);
}

function createClient(): PrismaClient {
  const pool = globalForPrisma.pgPool ?? createPool();
  globalForPrisma.pgPool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
