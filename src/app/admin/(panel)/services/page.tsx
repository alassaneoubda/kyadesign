import { prisma } from "@/lib/prisma";
import { deleteServiceAction, saveServiceAction } from "@/server/actions";

export const dynamic = "force-dynamic";

/**
 * Gestion complète des services affichés dans « Mes services ».
 */
export default async function ServicesPage({ searchParams }: PageProps<"/admin/services">) {
  const query = await searchParams;
  const items = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId) ?? null;
  const nextNumber = String(items.length + 1).padStart(2, "0");

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Services</h1>
          <p className="bo-lead">
            Chaque carte de la bande « Mes services » se gère ici : numéro, titre, texte et image.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#services" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {query.erreur && <p className="bo-error">Le formulaire est incomplet ou l’image est invalide.</p>}

      <div className="bo-workspace">
        <form className="bo-form" action={saveServiceAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier le service" : "Ajouter un service"}</h2>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="bo-form-grid">
            <label>
              Numéro
              <input name="number" required defaultValue={editing?.number ?? nextNumber} placeholder="01" />
            </label>
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? items.length + 1} />
            </label>
            <label className="full">
              Titre
              <input name="title" required defaultValue={editing?.title ?? ""} placeholder="Identité visuelle / logos" />
            </label>
            <label className="full">
              Description
              <textarea name="text" rows={3} required defaultValue={editing?.text ?? ""} />
            </label>
            <label className="full">
              Image {editing ? "(laisser vide pour garder l’actuelle)" : ""}
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" required={!editing} />
            </label>
            {editing?.image ? (
              <div className="full">
                <img src={editing.image} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
              </div>
            ) : null}
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Publier"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/services" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{items.length} service(s)</span>
          </div>
          {items.length === 0 ? (
            <p className="bo-empty">Aucun service. Ajoute-en un pour remplir la bande jaune du site.</p>
          ) : (
            <div className="bo-content-cards">
              {items.map((item) => (
                <article className="bo-content-card" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <strong>
                      {item.number} {item.title}
                    </strong>
                    <p>{item.text}</p>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <a
                        className="btn btn-ghost"
                        href={`/admin/services?edit=${item.id}`}
                        style={{ width: "auto", padding: "6px 10px" }}
                      >
                        Modifier
                      </a>
                      <form action={deleteServiceAction}>
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
