/**
 * Back-office — logiciels maîtrisés (jauges + icônes).
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v1
 */
import { prisma } from "@/lib/prisma";
import { deleteSoftwareAction, saveSoftwareAction } from "@/server/actions";

export const dynamic = "force-dynamic";

/**
 * Gestion des logiciels affichés dans « Logiciels maîtrisés ».
 */
export default async function LogicielsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const items = await prisma.software.findMany({ orderBy: { sortOrder: "asc" } });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId) ?? null;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Logiciels</h1>
          <p className="bo-lead">
            Ajoute un logiciel, règle le niveau de la jauge (0–100 %) et uploade son icône.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#logiciels" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      {query.erreur && (
        <p className="bo-error">Vérifie le nom, le niveau (0–100) et l’icône (SVG, PNG, JPG ou WEBP).</p>
      )}

      <div className="bo-workspace">
        <form className="bo-form" action={saveSoftwareAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier le logiciel" : "Ajouter un logiciel"}</h2>
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="bo-form-grid">
            <label className="full">
              Nom
              <input name="name" required defaultValue={editing?.name ?? ""} placeholder="Photoshop" />
            </label>
            <label>
              Niveau de jauge (%)
              <input
                name="level"
                type="number"
                min={0}
                max={100}
                required
                defaultValue={editing?.level ?? 80}
              />
            </label>
            <label>
              Ordre d’affichage
              <input name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? items.length + 1} />
            </label>
            <label className="full">
              Icône {editing ? "(laisser vide pour garder l’actuelle)" : ""}
              <input
                name="icon"
                type="file"
                accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg"
                required={!editing}
              />
            </label>
            {editing?.icon ? (
              <div className="full" style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={editing.icon}
                  alt=""
                  width={48}
                  height={48}
                  style={{ objectFit: "contain", background: "#111", borderRadius: 8, padding: 6 }}
                />
                <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>Icône actuelle</span>
              </div>
            ) : null}
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
            {editing && (
              <a className="btn btn-ghost" href="/admin/logiciels" style={{ width: "auto" }}>
                Annuler
              </a>
            )}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Sur le site</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{items.length} logiciel(s)</span>
          </div>
          {items.length === 0 ? (
            <p className="bo-empty">Aucun logiciel. Ajoute-en un pour remplir la section outils.</p>
          ) : (
            <div className="bo-content-cards">
              {items.map((item) => (
                <article className="bo-content-card" key={item.id}>
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt=""
                      style={{ width: 72, height: 72, objectFit: "contain", padding: 12, background: "#0a0a0a" }}
                    />
                  ) : (
                    <div style={{ width: 72, height: 72, background: "#222" }} />
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      Jauge : <strong style={{ color: "var(--bo-accent, #ffcc00)" }}>{item.level}%</strong>
                      {" · "}Ordre {item.sortOrder}
                    </p>
                    <div className="bo-soft-preview" aria-hidden="true">
                      <span style={{ display: "block", height: 4, background: "#333", borderRadius: 99, overflow: "hidden" }}>
                        <span
                          style={{
                            display: "block",
                            width: `${item.level}%`,
                            height: "100%",
                            background: "#ffcc00",
                          }}
                        />
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                      <a
                        className="btn btn-ghost"
                        href={`/admin/logiciels?edit=${item.id}`}
                        style={{ width: "auto", padding: "6px 10px" }}
                      >
                        Modifier
                      </a>
                      <form action={deleteSoftwareAction}>
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
