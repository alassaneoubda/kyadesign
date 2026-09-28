/**
 * Back-office — e-mail et mot de passe de connexion.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-28 — v1
 */
import { redirect } from "next/navigation";
import { AccountForm } from "@/components/forms/auth-forms";
import { getAdminCredentials } from "@/lib/admin-account";
import { getAdminSession } from "@/lib/auth";
import { ADMIN_PASSWORD_MIN } from "@/lib/validators";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const credentials = await getAdminCredentials();

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Réglages</p>
          <h1>Compte &amp; sécurité</h1>
          <p className="bo-lead">
            Change l’e-mail et le mot de passe utilisés pour entrer dans le back-office. Ton mot de passe actuel
            est demandé pour confirmer.
          </p>
        </div>
      </header>

      {credentials?.source === "env" && (
        <p className="bo-lead" style={{ marginBottom: 20 }}>
          Les accès actuels viennent encore de la configuration du serveur. Dès ton premier enregistrement, ce
          sont ceux définis ici qui seront utilisés.
        </p>
      )}

      <AccountForm currentEmail={session.email} minLength={ADMIN_PASSWORD_MIN} />
    </>
  );
}
