import { prisma } from "@/lib/prisma";
import { topicsFromJson } from "@/lib/validators";
import { deleteModeAction, saveModeAction } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function ModesPage({ searchParams }: PageProps<"/admin/modes">) {
  const query = await searchParams;
  const items = await prisma.trainingMode.findMany({ orderBy: { sortOrder: "asc" } });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId) ?? null;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Modes de formation</h1>
          <p className="bo-lead">En ligne ou présentiel, avec image — affichés dans Academy.</p>
        </div>
        <a className="btn btn-ghost" href="/#academy" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {query.erreur && <p className="bo-error">Vérifie l’identifiant, les textes et l’image.</p>}

      <div className="bo-workspace">
        <form className="bo-form" action={saveModeAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier le mode" : "Ajouter un mode"}</h2>
          <div className="bo-form-grid">
            <label>
              Identifiant (ex. ligne)
              <input
                name="id"
                required
                defaultValue={editing?.id ?? ""}
                readOnly={Boolean(editing)}
                placeholder="ligne"
              />
            </label>
            <label>
              Titre
              <input name="title" required defaultValue={editing?.title ?? ""} placeholder="Formation en ligne" />
            </label>
            <label className="full">
              Accroche
              <input name="lead" required defaultValue={editing?.lead ?? ""} />
            </label>
            <label className="full">
              Détail
              <textarea name="detail" rows={3} required defaultValue={editing?.detail ?? ""} />
            </label>
            <label className="full">
              Inclus, un par ligne
              <textarea
                name="includes"
                rows={5}
                required
                defaultValue={editing ? topicsFromJson(editing.includes).join("\n") : ""}
              />
            </label>
            <label className="full">
              Image {editing ? "(laisser vide pour garder l’actuelle)" : ""}
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" required={!editing} />
            </label>
            {editing?.image ? (
              <div className="full">
                <img src={editing.image} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover" }} />
              </div>
            ) : null}
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? items.length + 1} />
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Publier"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/modes" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{items.length} mode(s)</span>
          </div>
          {items.length === 0 ? (
            <p className="bo-empty">Aucun mode publié.</p>
          ) : (
            <div className="bo-content-cards">
              {items.map((item) => (
                <article className="bo-content-card" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.lead}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a className="btn btn-ghost" href={`/admin/modes?edit=${item.id}`} style={{ width: "auto", padding: "6px 10px" }}>
                        Modifier
                      </a>
                      <form action={deleteModeAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit">Retirer</button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
