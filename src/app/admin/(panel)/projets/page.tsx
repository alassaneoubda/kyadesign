import { prisma } from "@/lib/prisma";
import {
  deleteProjectAction,
  deleteProjectImageAction,
  saveProjectAction,
} from "@/server/actions";

export const dynamic = "force-dynamic";

/**
 * Gestion complète du portfolio (« Mes réalisations »).
 */
export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projets">) {
  const query = await searchParams;
  const [projects, categories] = await Promise.all([
    prisma.project.findMany({
      orderBy: { sortOrder: "asc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ where: { id: { not: "all" } }, orderBy: { sortOrder: "asc" } }),
  ]);
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = projects.find((item) => item.id === editId) ?? null;
  const tagsValue = editing
    ? (() => {
        try {
          const parsed = JSON.parse(editing.tags) as unknown;
          return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string").join(", ") : "";
        } catch {
          return editing.tags;
        }
      })()
    : "";

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Réalisations</h1>
          <p className="bo-lead">
            Toutes les pièces du portfolio : couverture, galerie, étude de projet. Visible dans « Mes réalisations ».
          </p>
        </div>
        <a className="btn btn-ghost" href="/#realisations" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {(query.erreur || query.erreur === "cover") && (
        <p className="bo-error">Complète la fiche et ajoute une image de couverture pour une nouvelle réalisation.</p>
      )}

      <div className="bo-workspace">
        <form className="bo-form" action={saveProjectAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier la réalisation" : "Nouvelle réalisation"}</h2>
          <div className="bo-form-grid">
            <label>
              Identifiant
              <input
                name="id"
                required
                defaultValue={editing?.id ?? ""}
                readOnly={Boolean(editing)}
                placeholder="mariage-abidjan"
              />
            </label>
            <label>
              Année
              <input name="year" required defaultValue={editing?.year ?? "2026"} />
            </label>
            <label className="full">
              Titre
              <input name="title" required defaultValue={editing?.title ?? ""} />
            </label>
            <label>
              Catégorie
              <select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Client
              <input name="clientName" required defaultValue={editing?.clientName ?? ""} />
            </label>
            <label className="full">
              Rôle
              <input name="role" required defaultValue={editing?.role ?? ""} />
            </label>
            <label className="full">
              Mots-clés, séparés par des virgules
              <input name="tags" defaultValue={tagsValue} />
            </label>
            <label className="full">
              Couverture {editing ? "(laisser vide pour garder l’actuelle)" : ""}
              <input name="cover" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" required={!editing} />
            </label>
            {editing?.cover ? (
              <div className="full">
                <img src={editing.cover} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
              </div>
            ) : null}
            <label className="full">
              Ajouter des images à la galerie
              <input name="gallery" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" multiple />
            </label>
            <label className="full">
              Problème
              <textarea name="probleme" required rows={2} defaultValue={editing?.probleme ?? ""} />
            </label>
            <label className="full">
              Concept
              <textarea name="concept" required rows={2} defaultValue={editing?.concept ?? ""} />
            </label>
            <label className="full">
              Création
              <textarea name="creation" required rows={2} defaultValue={editing?.creation ?? ""} />
            </label>
            <label className="full">
              Résultat
              <textarea name="resultat" required rows={2} defaultValue={editing?.resultat ?? ""} />
            </label>
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? projects.length + 1} />
            </label>
            <label className="bo-check">
              <input type="checkbox" name="featured" defaultChecked={editing?.featured ?? false} /> Mise en avant
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Publier"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/projets" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{projects.length} pièce(s)</span>
          </div>
          {projects.length === 0 ? (
            <p className="bo-empty">Aucune réalisation. Publie-en une pour remplir le portfolio.</p>
          ) : (
            <div className="bo-content-cards">
              {projects.map((project) => (
                <article className="bo-content-card" key={project.id}>
                  <img src={project.cover} alt="" />
                  <div>
                    <strong>{project.title}</strong>
                    <p>
                      {project.year} · {project.clientName}
                      {project.featured ? " · Mise en avant" : ""}
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a
                        className="btn btn-ghost"
                        href={`/admin/projets?edit=${project.id}`}
                        style={{ width: "auto", padding: "6px 10px" }}
                      >
                        Modifier
                      </a>
                      <form action={deleteProjectAction}>
                        <input type="hidden" name="id" value={project.id} />
                        <button type="submit">Retirer</button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {editing && editing.images.length > 0 && (
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
          )}
        </section>
      </div>
    </>
  );
}
