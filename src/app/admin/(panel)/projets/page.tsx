/**
 * Back-office — gestion du portfolio (« Mes réalisations »).
 * Tous les champs sont facultatifs ; l'œil affiche / masque une réalisation sans la supprimer.
 * Auteur : Kya Design — mise à jour 2026-09-29 — v2
 */
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Flash } from "@/components/admin/flash";
import { VisibilityToggle } from "@/components/admin/visibility-toggle";
import { prisma } from "@/lib/prisma";
import { joinDefined } from "@/lib/showcase";
import { deleteProjectAction, deleteProjectImageAction, saveProjectAction } from "@/server/actions";

export const dynamic = "force-dynamic";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp,image/tiff";

const OK_MESSAGES = {
  enregistre: "Réalisation enregistrée.",
  supprime: "Réalisation supprimée définitivement.",
};

const ERROR_MESSAGES = {
  format: "Un champ n'est pas au bon format (identifiant : minuscules, chiffres et tirets uniquement).",
  image: "L'image n'a pas pu être envoyée. Formats acceptés : JPG, PNG, WebP, TIFF.",
  introuvable: "Cette réalisation n'existe plus : recharge la page.",
  "1": "Enregistrement impossible, réessaie dans un instant.",
};

function tagsText(raw: string): string {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((tag): tag is string => typeof tag === "string").join(", ") : "";
  } catch {
    return raw;
  }
}

/**
 * Page « Réalisations ».
 * @param props.searchParams edit (id en modification), ok / erreur (retours d'action).
 */
export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projets">) {
  const query = await searchParams;
  const [projects, categories] = await Promise.all([
    prisma.project.findMany({
      orderBy: { sortOrder: "asc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      take: 300,
    }),
    prisma.category.findMany({ where: { id: { not: "all" } }, orderBy: { sortOrder: "asc" }, take: 100 }),
  ]);
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = projects.find((item) => item.id === editId) ?? null;
  const categoryLabel = (id: string) => categories.find((category) => category.id === id)?.label ?? "";
  const visibleCount = projects.filter((project) => project.visible).length;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Réalisations</h1>
          <p className="bo-lead">
            Toutes les pièces du portfolio. Chaque champ est facultatif : ce qui est laissé vide n&apos;apparaît
            simplement pas sur le site. L&apos;œil masque une réalisation sans la supprimer.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#realisations" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      <Flash query={query} ok={OK_MESSAGES} errors={ERROR_MESSAGES} />

      <div className="bo-workspace">
        <form className="bo-form" action={saveProjectAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier la réalisation" : "Nouvelle réalisation"}</h2>
          {editing ? <input type="hidden" name="existingId" value={editing.id} /> : null}
          <div className="bo-form-grid">
            <label>
              Identifiant (URL)
              <input
                name="id"
                defaultValue={editing?.id ?? ""}
                readOnly={Boolean(editing)}
                placeholder="Généré depuis le titre"
                pattern="[a-z0-9\-]*"
                maxLength={60}
              />
            </label>
            <label>
              Année
              <input name="year" defaultValue={editing?.year ?? ""} placeholder="2026" maxLength={10} />
            </label>
            <label className="full">
              Titre
              <input name="title" defaultValue={editing?.title ?? ""} maxLength={120} />
            </label>
            <label>
              Catégorie
              <select name="categoryId" defaultValue={editing?.categoryId ?? ""}>
                <option value="">— Aucune —</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Client
              <input name="clientName" defaultValue={editing?.clientName ?? ""} maxLength={120} />
            </label>
            <label className="full">
              Rôle
              <input name="role" defaultValue={editing?.role ?? ""} maxLength={160} />
            </label>
            <label className="full">
              Mots-clés, séparés par des virgules
              <input name="tags" defaultValue={editing ? tagsText(editing.tags) : ""} maxLength={200} />
            </label>
            <label className="full">
              Couverture {editing?.cover ? "(laisser vide pour garder l’actuelle)" : ""}
              <input name="cover" type="file" accept={IMAGE_TYPES} />
            </label>
            {editing?.cover ? (
              <div className="full bo-cover-preview">
                <img src={editing.cover} alt="" />
                <label className="bo-check">
                  <input type="checkbox" name="removeCover" /> Retirer la couverture
                </label>
              </div>
            ) : null}
            <label className="full">
              Ajouter des images à la galerie
              <input name="gallery" type="file" accept={IMAGE_TYPES} multiple />
            </label>
            <label className="full">
              Problème
              <textarea name="probleme" rows={2} defaultValue={editing?.probleme ?? ""} maxLength={800} />
            </label>
            <label className="full">
              Concept
              <textarea name="concept" rows={2} defaultValue={editing?.concept ?? ""} maxLength={800} />
            </label>
            <label className="full">
              Création
              <textarea name="creation" rows={2} defaultValue={editing?.creation ?? ""} maxLength={800} />
            </label>
            <label className="full">
              Résultat
              <textarea name="resultat" rows={2} defaultValue={editing?.resultat ?? ""} maxLength={800} />
            </label>
            <label>
              Ordre
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={editing?.sortOrder ?? projects.length + 1} />
            </label>
            <div className="bo-check-group">
              <label className="bo-check">
                <input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /> Visible sur le site
              </label>
              <label className="bo-check">
                <input type="checkbox" name="featured" defaultChecked={editing?.featured ?? false} /> Mise en avant
              </label>
            </div>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Publier"}
            </button>
            {editing ? (
              <a className="btn btn-ghost" href="/admin/projets" style={{ width: "auto" }}>
                Annuler
              </a>
            ) : null}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
              {visibleCount} visible(s) sur {projects.length}
            </span>
          </div>
          {projects.length === 0 ? (
            <p className="bo-empty">Aucune réalisation. Publie-en une pour remplir le portfolio.</p>
          ) : (
            <div className="bo-content-cards">
              {projects.map((project) => {
                const title = project.title.trim() || "(Sans titre)";
                const meta = joinDefined([project.year, project.clientName, categoryLabel(project.categoryId)]);
                return (
                  <article className={`bo-content-card${project.visible ? "" : " is-hidden"}`} key={project.id}>
                    {project.cover ? (
                      <img src={project.cover} alt="" />
                    ) : (
                      <span className="bo-content-placeholder" aria-hidden="true">
                        KYA
                      </span>
                    )}
                    <div>
                      <strong>{title}</strong>
                      <p>
                        {meta || "Aucune information complémentaire"}
                        {project.featured ? " · Mise en avant" : ""}
                      </p>
                      <div className="bo-row-actions">
                        <VisibilityToggle entity="project" id={project.id} visible={project.visible} label={title} />
                        <a className="btn btn-ghost bo-btn-sm" href={`/admin/projets?edit=${encodeURIComponent(project.id)}`}>
                          Modifier
                        </a>
                        <form action={deleteProjectAction}>
                          <input type="hidden" name="id" value={project.id} />
                          <ConfirmSubmit message={`Supprimer définitivement « ${title} » ? Pour la cacher seulement, utilise l'œil.`}>
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

          {editing && editing.images.length > 0 ? (
            <>
              <div className="bo-panel-head" style={{ marginTop: 20 }}>
                <h2>Galerie de cette pièce</h2>
              </div>
              <div className="bo-photo-grid">
                {editing.images.map((image) => (
                  <article className="bo-photo-card" key={image.id}>
                    <img src={image.src} alt="" />
                    <div>
                      <span>Image galerie</span>
                      <form action={deleteProjectImageAction}>
                        <input type="hidden" name="id" value={image.id} />
                        <input type="hidden" name="projectId" value={editing.id} />
                        <button type="submit">Retirer</button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </>
  );
}
