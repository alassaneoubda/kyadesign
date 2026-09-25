import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

/**
 * Tableau de bord : volumes, actions rapides, dernières demandes et albums.
 */
export default async function DashboardPage() {
  const [albums, photos, projects, formations, packs, demandes, recentDemandes, recentAlbums] =
    await Promise.all([
      prisma.album.count(),
      prisma.albumPhoto.count(),
      prisma.project.count(),
      prisma.formation.count(),
      prisma.pack.count(),
      prisma.contactRequest.count(),
      prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.album.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { photos: true } } },
      }),
    ]);

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Pilotage</p>
          <h1>Tableau de bord</h1>
          <p className="bo-lead">
            Vue d’ensemble de ta plateforme : demandes clients, albums privés et contenu du site.
          </p>
        </div>
        <Link className="btn" href="/admin/albums" style={{ width: "auto", minWidth: 200 }}>
          Nouvel album
        </Link>
      </header>

      <section className="bo-stats" aria-label="Indicateurs">
        <article className="bo-stat">
          <span>Demandes</span>
          <strong>{demandes}</strong>
          <small>Formulaires reçus</small>
        </article>
        <article className="bo-stat">
          <span>Albums</span>
          <strong>{albums}</strong>
          <small>{photos} photos déposées</small>
        </article>
        <article className="bo-stat">
          <span>Réalisations</span>
          <strong>{projects}</strong>
          <small>Portfolio public</small>
        </article>
        <article className="bo-stat">
          <span>Academy</span>
          <strong>{formations + packs}</strong>
          <small>
            {formations} formations · {packs} packs
          </small>
        </article>
      </section>

      <section className="bo-grid-2">
        <div className="bo-panel">
          <div className="bo-panel-head">
            <h2>Actions rapides</h2>
          </div>
          <div className="bo-actions">
            <Link className="bo-action" href="/admin/demandes">
              <div>
                <strong>Lire les demandes</strong>
                <span>Briefs envoyés depuis le formulaire contact</span>
              </div>
              <em>Ouvrir</em>
            </Link>
            <Link className="bo-action" href="/admin/albums">
              <div>
                <strong>Créer un album privé</strong>
                <span>Code + lien pour le client, jusqu’à 200 photos</span>
              </div>
              <em>Créer</em>
            </Link>
            <Link className="bo-action" href="/admin/projets">
              <div>
                <strong>Publier une réalisation</strong>
                <span>Ajoute une pièce au portfolio du site</span>
              </div>
              <em>Publier</em>
            </Link>
            <Link className="bo-action" href="/admin/formations">
              <div>
                <strong>Gérer l’Academy</strong>
                <span>Formations et packs affichés sur le site</span>
              </div>
              <em>Gérer</em>
            </Link>
          </div>
        </div>

        <div className="bo-panel">
          <div className="bo-panel-head">
            <h2>Derniers albums</h2>
            <Link href="/admin/albums">Tout voir</Link>
          </div>
          {recentAlbums.length === 0 ? (
            <p className="bo-empty">Aucun album pour le moment.</p>
          ) : (
            <div className="bo-list" style={{ border: 0, background: "transparent" }}>
              {recentAlbums.map((album) => (
                <article key={album.id} style={{ paddingInline: 0 }}>
                  <div>
                    <strong>{album.title}</strong>
                    <p>
                      {album._count.photos} photos · {album.accessCode}
                    </p>
                  </div>
                  <a href={`/admin/albums/${album.id}`}>Gérer</a>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2>Dernières demandes</h2>
          <Link href="/admin/demandes">Toutes les demandes</Link>
        </div>
        {recentDemandes.length === 0 ? (
          <p className="bo-empty">Aucune demande pour le moment.</p>
        ) : (
          <div className="bo-list" style={{ border: 0, background: "transparent" }}>
            {recentDemandes.map((request) => (
              <article key={request.id} style={{ paddingInline: 0 }}>
                <div>
                  <strong>{request.name}</strong>
                  <p>
                    {formatDate(request.createdAt)}
                    {request.projectType ? ` · ${request.projectType}` : ""}
                  </p>
                  <p>{request.message.slice(0, 140)}{request.message.length > 140 ? "…" : ""}</p>
                </div>
                <span className={`bo-badge${request.emailSent ? "" : " is-warn"}`}>
                  {request.emailSent ? "Mail envoyé" : "Sans mail"}
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
