/**
 * Back-office — témoignages clients (« Nos témoignages clients »).
 * Nom et texte obligatoires ; photo, fonction et entreprise facultatives.
 * Seuls de vrais avis doivent être saisis : aucun témoignage n'est pré-rempli.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Flash } from "@/components/admin/flash";
import { VisibilityToggle } from "@/components/admin/visibility-toggle";
import { prisma } from "@/lib/prisma";
import { initials, joinDefined } from "@/lib/showcase";
import { deleteTestimonialAction, saveTestimonialAction } from "@/server/showcase-actions";

export const dynamic = "force-dynamic";

const IMAGE_TYPES = "image/jpeg,image/png,image/webp";

const OK_MESSAGES = {
  enregistre: "Témoignage enregistré.",
  supprime: "Témoignage supprimé.",
};

const ERROR_MESSAGES = {
  nom: "Indique le nom du client (2 caractères minimum).",
  texte: "Le témoignage doit contenir entre 10 et 1 200 caractères.",
  image: "La photo n'a pas pu être envoyée. Formats acceptés : JPG, PNG, WebP.",
  "1": "Enregistrement impossible, réessaie dans un instant.",
};

/**
 * Page « Témoignages ».
 * @param props.searchParams edit (id en modification), ok / erreur (retours d'action).
 */
export default async function TestimonialsPage({ searchParams }: PageProps<"/admin/temoignages">) {
  const query = await searchParams;
  const items = await prisma.testimonial.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 200 });
  const editId = typeof query.edit === "string" ? query.edit : "";
  const editing = items.find((item) => item.id === editId) ?? null;
  const pending = items.filter((item) => item.source === "visitor" && !item.visible).length;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Témoignages</h1>
          <p className="bo-lead">
            Les visiteurs laissent leur avis depuis le site (« Laisser un avis ») : il arrive ici masqué. Relis-le,
            puis clique sur l&apos;œil pour le publier dans « Nos témoignages clients ». Tu peux aussi ajouter
            toi-même l&apos;avis d&apos;un client reçu par un autre canal.
          </p>
        </div>
        <a className="btn btn-ghost" href="/#temoignages" target="_blank" rel="noopener noreferrer" style={{ width: "auto" }}>
          Voir sur le site
        </a>
      </header>

      <Flash query={query} ok={OK_MESSAGES} errors={ERROR_MESSAGES} />
      {pending > 0 ? (
        <p className="bo-pending" role="status">
          {pending} avis visiteur{pending > 1 ? "s" : ""} en attente de validation — clique sur l&apos;œil pour
          publier, ou supprime les avis indésirables.
        </p>
      ) : null}

      <div className="bo-workspace">
        <form className="bo-form" action={saveTestimonialAction} key={editing?.id ?? "new"}>
          <h2>{editing ? "Modifier le témoignage" : "Nouveau témoignage"}</h2>
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="bo-form-grid">
            <label className="full">
              Nom du client *
              <input name="name" required minLength={2} maxLength={120} defaultValue={editing?.name ?? ""} />
            </label>
            <label>
              Fonction (facultatif)
              <input name="role" maxLength={120} defaultValue={editing?.role ?? ""} placeholder="Directrice marketing" />
            </label>
            <label>
              Entreprise (facultatif)
              <input name="company" maxLength={120} defaultValue={editing?.company ?? ""} />
            </label>
            <label className="full">
              Témoignage *
              <textarea name="quote" required minLength={10} maxLength={1200} rows={5} defaultValue={editing?.quote ?? ""} />
            </label>
            <label className="full">
              Photo (facultatif) {editing?.photo ? "— laisser vide pour garder l’actuelle" : ""}
              <input name="photo" type="file" accept={IMAGE_TYPES} />
            </label>
            {editing?.photo ? (
              <div className="full bo-cover-preview is-avatar">
                <img src={editing.photo} alt="" />
                <label className="bo-check">
                  <input type="checkbox" name="removePhoto" /> Retirer la photo
                </label>
              </div>
            ) : null}
            <label>
              Ordre
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={editing?.sortOrder ?? items.length + 1} />
            </label>
            <label className="bo-check">
              <input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /> Publié sur le site
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              {editing ? "Enregistrer" : "Ajouter"}
            </button>
            {editing ? (
              <a className="btn btn-ghost" href="/admin/temoignages" style={{ width: "auto" }}>
                Annuler
              </a>
            ) : null}
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Témoignages</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>
              {items.filter((item) => item.visible).length} publié(s) sur {items.length}
            </span>
          </div>
          {items.length === 0 ? (
            <p className="bo-empty">
              Aucun témoignage pour l&apos;instant. Les avis envoyés par les visiteurs apparaîtront ici.
            </p>
          ) : (
            <div className="bo-content-cards">
              {items.map((item) => {
                const meta = joinDefined([item.role, item.company]);
                return (
                  <article className={`bo-content-card is-compact${item.visible ? "" : " is-hidden"}`} key={item.id}>
                    {item.photo ? (
                      <img className="bo-avatar" src={item.photo} alt="" />
                    ) : (
                      <span className="bo-avatar is-initials" aria-hidden="true">
                        {initials(item.name)}
                      </span>
                    )}
                    <div>
                      <strong>{item.name}</strong>
                      {item.source === "visitor" ? (
                        <span className={`bo-badge${item.visible ? "" : " is-warn"}`}>
                          {item.visible ? "Avis visiteur · publié" : "Avis visiteur · à valider"}
                        </span>
                      ) : null}
                      {meta ? <p>{meta}</p> : null}
                      <p className="bo-quote-excerpt">« {item.quote} »</p>
                      <div className="bo-row-actions">
                        <VisibilityToggle entity="testimonial" id={item.id} visible={item.visible} label={item.name} />
                        <a className="btn btn-ghost bo-btn-sm" href={`/admin/temoignages?edit=${encodeURIComponent(item.id)}`}>
                          Modifier
                        </a>
                        <form action={deleteTestimonialAction}>
                          <input type="hidden" name="id" value={item.id} />
                          <ConfirmSubmit message={`Supprimer le témoignage de « ${item.name} » ? Pour le cacher seulement, utilise l'œil.`}>
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
