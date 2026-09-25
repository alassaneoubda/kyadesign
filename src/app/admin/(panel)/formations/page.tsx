import { prisma } from "@/lib/prisma";
import { topicsFromJson } from "@/lib/validators";
import { deleteFormationAction, saveFormationAction } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function FormationsPage({ searchParams }: PageProps<"/admin/formations">) {
  const query = await searchParams;
  const items = await prisma.formation.findMany({ orderBy: { sortOrder: "asc" } });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId) ?? null;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Formations</h1>
          <p className="bo-lead">Crée ou modifie une formation. Elle apparaît dans Academy sur le site.</p>
        </div>
        <a className="btn btn-ghost" href="/#academy" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {query.erreur && <p className="bo-error">Le formulaire est incomplet ou l’image est invalide.</p>}

      <div className="bo-workspace">
        <form className="bo-form" action={saveFormationAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier la formation" : "Ajouter une formation"}</h2>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="bo-form-grid">
            <label className="full">
              Titre
              <input name="title" required defaultValue={editing?.title ?? ""} placeholder="Photoshop" />
            </label>
            <label className="full">
              Présentation
              <textarea name="summary" rows={3} required defaultValue={editing?.summary ?? ""} />
            </label>
            <label className="full">
              Éléments enseignés, un par ligne
              <textarea
                name="topics"
                rows={6}
                required
                defaultValue={editing ? topicsFromJson(editing.topics).join("\n") : ""}
                placeholder={"Interface\nCalques\nRetouche"}
              />
            </label>
            <label className="full">
              Image de couverture {editing ? "(laisser vide pour garder l’actuelle)" : ""}
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" required={!editing} />
            </label>
            {editing?.image && (
              <div className="full">
                <img src={editing.image} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover" }} />
              </div>
            )}
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? items.length + 1} />
            </label>
            <label className="bo-check">
              <input type="checkbox" name="published" defaultChecked={editing?.published ?? true} /> Visible sur le site
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Publier"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/formations" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{items.length} formation(s)</span>
          </div>
          {items.length === 0 ? (
            <p className="bo-empty">Aucune formation publiée.</p>
          ) : (
            <div className="bo-content-cards">
              {items.map((item) => (
                <article className="bo-content-card" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.published ? "En ligne" : "Masquée"} · {topicsFromJson(item.topics).length} points
                    </p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a className="btn btn-ghost" href={`/admin/formations?edit=${item.id}`} style={{ width: "auto", padding: "6px 10px" }}>
                        Modifier
                      </a>
                      <form action={deleteFormationAction}>
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
