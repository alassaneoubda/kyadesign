/**
 * Back-office — réseaux sociaux affichés dans « Suivez-nous » (section contact).
 * Ajout, modification, suppression, ordre et visibilité ; synchronisé avec le site public.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Flash } from "@/components/admin/flash";
import { VisibilityToggle } from "@/components/admin/visibility-toggle";
import { SocialIcon } from "@/components/site/icons";
import { prisma } from "@/lib/prisma";
import { SOCIAL_PLATFORMS, socialDisplayName } from "@/lib/social";
import { deleteSocialLinkAction, saveSocialLinkAction } from "@/server/showcase-actions";

export const dynamic = "force-dynamic";

const OK_MESSAGES = {
  enregistre: "Réseau enregistré — le site est à jour.",
  supprime: "Réseau supprimé.",
};

const ERROR_MESSAGES = {
  lien: "Lien invalide : colle l'adresse complète du profil, commençant par https://",
  reseau: "Choisis un réseau dans la liste.",
  "1": "Enregistrement impossible, réessaie dans un instant.",
};

/**
 * Page « Réseaux sociaux ».
 * @param props.searchParams edit (id en modification), ok / erreur (retours d'action).
 */
export default async function SocialLinksPage({ searchParams }: PageProps<"/admin/reseaux">) {
  const query = await searchParams;
  const links = await prisma.socialLink.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], take: 100 });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = links.find((link) => link.id === editId) ?? null;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Réseaux sociaux</h1>
          <p className="bo-lead">
            Les icônes « Suivez-nous » de la section contact. Seuls les réseaux visibles et dotés d&apos;un lien valide
            sont affichés sur le site.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#contact" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      <Flash query={query} ok={OK_MESSAGES} errors={ERROR_MESSAGES} />

      <div className="bo-workspace">
        <form className="bo-form" action={saveSocialLinkAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier le réseau" : "Ajouter un réseau"}</h2>
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="bo-form-grid">
            <label>
              Réseau (icône)
              <select name="platform" defaultValue={editing?.platform ?? "instagram"} required>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nom affiché (facultatif)
              <input name="label" defaultValue={editing?.label ?? ""} placeholder="Ex. Instagram Studio" maxLength={60} />
            </label>
            <label className="full">
              Lien du profil
              <input
                name="url"
                type="url"
                required
                defaultValue={editing?.url ?? ""}
                placeholder="https://www.instagram.com/kya_design"
                maxLength={500}
              />
            </label>
            <label>
              Identifiant (facultatif)
              <input name="handle" defaultValue={editing?.handle ?? ""} placeholder="@kya_design" maxLength={80} />
            </label>
            <label>
              Ordre
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={editing?.sortOrder ?? links.length + 1} />
            </label>
            <label className="bo-check full">
              <input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /> Visible sur le site
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
            {editing ? (
              <a className="btn btn-ghost" href="/admin/reseaux" style={{ width: "auto" }}>
                Annuler
              </a>
            ) : null}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Réseaux enregistrés</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
              {links.filter((link) => link.visible).length} visible(s) sur {links.length}
            </span>
          </div>
          {links.length === 0 ? (
            <p className="bo-empty">Aucun réseau. Ajoute ton premier profil avec le formulaire.</p>
          ) : (
            <div className="bo-content-cards">
              {links.map((link) => {
                const name = socialDisplayName(link);
                return (
                  <article className={`bo-content-card is-compact${link.visible ? "" : " is-hidden"}`} key={link.id}>
                    <span className="bo-social-ico" aria-hidden="true">
                      <SocialIcon platform={link.platform} />
                    </span>
                    <div>
                      <strong>{name}</strong>
                      <p className="bo-ellipsis">{link.handle ? `${link.handle} · ${link.url}` : link.url}</p>
                      <div className="bo-row-actions">
                        <VisibilityToggle entity="social" id={link.id} visible={link.visible} label={name} />
                        <a className="btn btn-ghost bo-btn-sm" href={`/admin/reseaux?edit=${encodeURIComponent(link.id)}`}>
                          Modifier
                        </a>
                        <form action={deleteSocialLinkAction}>
                          <input type="hidden" name="id" value={link.id} />
                          <ConfirmSubmit message={`Supprimer « ${name} » ? Pour le cacher seulement, utilise l'œil.`}>
                            Supprimer
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
