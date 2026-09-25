import { prisma } from "@/lib/prisma";
import { saveAlbumAction } from "@/server/actions";
import { createAccessCode } from "@/lib/codes";

export const dynamic = "force-dynamic";

export default async function AlbumsPage({ searchParams }: PageProps<"/admin/albums">) {
  const query = await searchParams;
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { photos: true } } },
  });
  const suggested = createAccessCode();

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Contenu</p>
          <h1>Albums privés</h1>
          <p className="bo-lead">
            Crée un album, définis le code, charge les photos, puis envoie le lien au client.
          </p>
        </div>
      </header>

      {query.erreur && (
        <p className="bo-error">Vérifie le titre et le code (lettres, chiffres, tirets).</p>
      )}

      <form className="bo-form" action={saveAlbumAction}>
        <h2>Nouvel album</h2>
        <div className="bo-form-grid">
          <label className="full">
            Nom de l’album
            <input name="title" required placeholder="Mariage Awa & Serge" />
          </label>
          <label>
            Personnes
            <input name="persons" placeholder="Awa K. & Serge A." />
          </label>
          <label>
            Date
            <input name="eventDate" placeholder="21 août 2026" />
          </label>
          <label>
            Type
            <input name="eventType" defaultValue="Mariage" />
          </label>
          <label>
            Lieu
            <input name="place" placeholder="Abidjan" />
          </label>
          <label className="full">
            Description
            <textarea name="description" rows={3} />
          </label>
          <label>
            Code d’accès
            <input name="accessCode" defaultValue={suggested} required />
          </label>
          <label>
            Photos téléchargeables au maximum
            <input name="maxPhotos" type="number" min={1} max={400} defaultValue={200} />
          </label>
          <label>
            Ordre
            <input name="sortOrder" type="number" defaultValue={albums.length} />
          </label>
          <label className="bo-check">
            <input type="checkbox" name="published" defaultChecked /> Publié
          </label>
        </div>
        <input type="hidden" name="kind" value="gallery" />
        <div className="bo-form-actions">
          <button className="btn" type="submit">
            Créer l’album
          </button>
        </div>
      </form>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>Albums existants</h2>
          <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{albums.length} album(s)</span>
        </div>
        {albums.length === 0 ? (
          <p className="bo-empty">Aucun album créé pour le moment.</p>
        ) : (
          <div className="bo-list" style={{ border: 0, background: "transparent" }}>
            {albums.map((album) => (
              <article key={album.id} style={{ paddingInline: 0 }}>
                <div>
                  <strong>{album.title}</strong>
                  <p>
                    {album._count.photos} photos · code {album.accessCode}
                    {album.eventDate ? ` · ${album.eventDate}` : ""}
                  </p>
                </div>
                <a href={`/admin/albums/${album.id}`}>Gérer les photos</a>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
