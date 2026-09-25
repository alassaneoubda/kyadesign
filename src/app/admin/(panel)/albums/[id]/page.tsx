import { notFound } from "next/navigation";
import { ShareBox } from "@/components/admin/share-box";
import { PhotoUploader } from "@/components/gallery/photo-uploader";
import { prisma } from "@/lib/prisma";
import { deleteAlbumAction, deletePhotoAction, saveAlbumAction } from "@/server/actions";

export const dynamic = "force-dynamic";

function shareMessage(title: string, code: string): string {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [
    "Bonjour,",
    "Vos photos sont disponibles.",
    "",
    `Album : ${title}`,
    `Lien : ${origin}/galerie`,
    `Code d'accès : ${code}`,
    "",
    "Ouvrez le lien, saisissez le code, consultez les photos et téléchargez celles que vous voulez.",
    "Les fichiers téléchargés sont les originaux, sans compression.",
  ].join("\n");
}

export default async function AlbumEditPage({ params }: PageProps<"/admin/albums/[id]">) {
  const { id } = await params;
  const album = await prisma.album.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!album) notFound();

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Album privé</p>
          <h1>{album.title}</h1>
          <p className="bo-lead">
            {album.photos.length} photo(s) · code <strong style={{ color: "var(--bo-gold)" }}>{album.accessCode}</strong>
          </p>
        </div>
        <form action={deleteAlbumAction}>
          <input type="hidden" name="id" value={album.id} />
          <button className="btn btn-ghost" type="submit" style={{ width: "auto" }}>
            Supprimer l’album
          </button>
        </form>
      </header>

      <ShareBox message={shareMessage(album.title, album.accessCode)} />

      <div className="bo-workspace">
        <form className="bo-form" action={saveAlbumAction}>
          <h2>Informations</h2>
          <input type="hidden" name="id" value={album.id} />
          <input type="hidden" name="kind" value={album.kind} />
          <div className="bo-form-grid">
            <label className="full">
              Nom
              <input name="title" defaultValue={album.title} required />
            </label>
            <label>
              Personnes
              <input name="persons" defaultValue={album.persons} />
            </label>
            <label>
              Date
              <input name="eventDate" defaultValue={album.eventDate} />
            </label>
            <label>
              Type
              <input name="eventType" defaultValue={album.eventType} />
            </label>
            <label>
              Lieu
              <input name="place" defaultValue={album.place} />
            </label>
            <label className="full">
              Description
              <textarea name="description" rows={3} defaultValue={album.description} />
            </label>
            <label>
              Code
              <input name="accessCode" defaultValue={album.accessCode} required />
            </label>
            <label>
              Maximum téléchargeable
              <input name="maxPhotos" type="number" min={1} max={400} defaultValue={album.maxPhotos} />
            </label>
            <label>
              Ordre
              <input name="sortOrder" type="number" defaultValue={album.sortOrder} />
            </label>
            <label className="bo-check">
              <input type="checkbox" name="published" defaultChecked={album.published} /> Publié
            </label>
          </div>
          <div className="bo-form-actions">
            <button className="btn" type="submit">
              Enregistrer
            </button>
          </div>
        </form>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2>Photos</h2>
            <span style={{ color: "var(--bo-muted)", fontSize: "0.85rem" }}>{album.photos.length} fichier(s)</span>
          </div>
          <PhotoUploader albumId={album.id} />
          {album.photos.length === 0 ? (
            <p className="bo-empty" style={{ marginTop: 16 }}>
              Dépose les photos ci-dessus. Les originaux sont conservés.
            </p>
          ) : (
            <div className="bo-photo-grid">
              {album.photos.map((photo) => (
                <article className="bo-photo-card" key={photo.id}>
                  <img src={`/api/media/${photo.id}/thumb`} alt="" />
                  <div>
                    <span title={photo.originalName}>{photo.originalName}</span>
                    <form action={deletePhotoAction}>
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="albumId" value={album.id} />
                      <button type="submit">Retirer</button>
                    </form>
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
