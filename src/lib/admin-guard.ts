/**
 * Garde d'accès des opérations back-office (server actions).
 * Les server actions sont joignables par POST direct : chaque action doit l'appeler.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

/**
 * Vérifie la session administrateur (JWT signé + accès en vigueur) côté serveur.
 * @throws Redirection Next vers /admin/login si la session est absente ou révoquée.
 */
export async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
}
