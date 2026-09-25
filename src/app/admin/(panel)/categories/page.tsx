/**
 * Back-office — catégories du portfolio.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v1
 */
import { prisma } from "@/lib/prisma";
import { deleteCategoryAction, saveCategoryAction } from "@/server/actions";

export const dynamic = "force-dynamic";

/**
 * Créer / modifier / supprimer les filtres de réalisations.
 */
export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const items = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId && item.id !== "all") ?? null;
  const counts = await prisma.project.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
  });
  const countMap = Object.fromEntries(counts.map((row) => [row.categoryId, row._count._all]));

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Catégories</h1>
          <p className="bo-lead">
            Crée les filtres du portfolio (Identité visuelle, Publicité…). Assigne ensuite chaque
            réalisation à une catégorie.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#realisations" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {query.erreur === "liee" && (
        <p className="bo-error">Impossible de supprimer : des réalisations utilisent encore cette catégorie.</p>
      )}
      {query.erreur === "1" && (
        <p className="bo-error">Identifiant invalide ou déjà utilisé (minuscules, tirets uniquement).</p>
      )}

      <div className="bo-workspace">
        <form className="bo-form" action={saveCategoryAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier la catégorie" : "Ajouter une catégorie"}</h2>
          {editing && <input type="hidden" name="existingId" value={editing.id} />}
          <div className="bo-form-grid">
            <label>
              Identifiant technique
              <input
                name="id"
                required
                disabled={Boolean(editing)}
                defaultValue={editing?.id ?? ""}
                placeholder="identite-visuelle"
              />
            </label>
            {editing && <input type="hidden" name="id" value={editing.id} />}
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? items.length} />
            </label>
            <label className="full">
              Libellé affiché
              <input name="label" required defaultValue={editing?.label ?? ""} placeholder="Identité visuelle" />
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Créer"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/categories" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Filtres du site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{items.length} catégorie(s)</span>
          </div>
          <div className="bo-content-cards">
            {items.map((item) => (
              <article className="bo-content-card" key={item.id}>
                <div style={{ padding: 16 }}>
                  <strong>{item.label}</strong>
                  <p>
                    id: <code>{item.id}</code>
                    {" · "}
                    {item.id === "all" ? "filtre global" : `${countMap[item.id] ?? 0} réalisation(s)`}
                  </p>
                  {item.id !== "all" && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <a
                        className="btn btn-ghost"
                        href={`/admin/categories?edit=${item.id}`}
                        style={{ width: "auto", padding: "6px 10px" }}
                      >
                        Modifier
                      </a>
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit">Retirer</button>
                      </form>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
