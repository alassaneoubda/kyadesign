/**
 * Client Prisma via adaptateur pg (SSL Supabase fiable sous Windows).
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v2
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

/**
 * Nettoie l'URL pour le driver pg (SSL géré à part).
 * @param url Chaîne DATABASE_URL.
 */
function connectionString(url: string | undefined): string {
  if (!url) throw new Error("DATABASE_URL manquant.");
  return url
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/[?&]uselibpqcompat=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

function createClient(): PrismaClient {
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: connectionString(process.env.DATABASE_URL),
      ssl: { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 15000,
    });
  globalForPrisma.pgPool = pool;
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
