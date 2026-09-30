/**
 * Back-office — gestion du portfolio (« Mes réalisations »).
 * Tous les champs sont facultatifs ; l'œil affiche / masque une réalisation sans la supprimer.
 * Auteur : Kya Design — mise à jour 2026-09-29 — v2
 */
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Flash } from "@/components/admin/flash";
import { ProjectForm, type ProjectFormValues } from "@/components/admin/project-form";
import { VisibilityToggle } from "@/components/admin/visibility-toggle";
import { prisma } from "@/lib/prisma";
import { joinDefined } from "@/lib/showcase";
import { deleteProjectAction, deleteProjectImageAction } from "@/server/actions";

export const dynamic = "force-dynamic";

const OK_MESSAGES = {
  enregistre: "Réalisation enregistrée.",
  supprime: "Réalisation supprimée définitivement.",
};

const ERROR_MESSAGES = {
  "1": "Opération impossible, réessaie dans un instant.",
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
  const formValues: ProjectFormValues | null = editing
    ? {
        id: editing.id,
        title: editing.title,
        categoryId: editing.categoryId,
        year: editing.year,
        clientName: editing.clientName,
        role: editing.role,
        tags: tagsText(editing.tags),
        cover: editing.cover,
        probleme: editing.probleme,
        concept: editing.concept,
        creation: editing.creation,
        resultat: editing.resultat,
        sortOrder: editing.sortOrder,
        visible: editing.visible,
        featured: editing.featured,
      }
    : null;
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
        <ProjectForm
          key={editing?.id ?? "new"}
          editing={formValues}
          categories={categories.map(({ id, label }) => ({ id, label }))}
          defaultSortOrder={projects.length + 1}
        />

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
