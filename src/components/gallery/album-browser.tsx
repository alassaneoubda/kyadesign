"use client";

import { useMemo, useState } from "react";
import { selectionState } from "@/lib/academy";

type Photo = { id: string; originalName: string; bytes: number };
type Album = {
  id: string;
  title: string;
  persons: string;
  eventDate: string;
  eventType: string;
  description: string;
  maxPhotos: number;
  kind: string;
  probleme: string;
  concept: string;
  creation: string;
  resultat: string;
  photos: Photo[];
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Galerie invitée : aperçus légers, téléchargement des fichiers d'origine.
 */
export function AlbumBrowser({ albums }: { albums: Album[] }) {
  const [albumId, setAlbumId] = useState(albums[0]?.id ?? "");
  const album = albums.find((item) => item.id === albumId) ?? albums[0];
  const [selected, setSelected] = useState<string[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const state = selectionState(selected.length, album?.maxPhotos ?? 0);
  const open = album?.photos.find((photo) => photo.id === openId) ?? null;
  const openIndex = album ? album.photos.findIndex((photo) => photo.id === openId) : -1;

  const blocked = useMemo(() => !state.canAdd, [state.canAdd]);

  if (!album) return null;

  function toggle(id: string) {
    setNotice("");
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= album.maxPhotos) {
        setNotice(`Tu as atteint la limite de ${album.maxPhotos} photos. Retire-en une pour en choisir une autre.`);
        return current;
      }
      return [...current, id];
    });
  }

  async function downloadZip(ids: string[]) {
    setBusy(true);
    setNotice("");
    const response = await fetch("/api/albums/download", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ albumId: album.id, photoIds: ids }),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      setNotice(payload?.message ?? "Téléchargement impossible.");
      setBusy(false);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${album.title}.zip`;
    link.click();
    URL.revokeObjectURL(url);
    setBusy(false);
  }

  function step(direction: number) {
    if (!album || openIndex < 0) return;
    const next = album.photos[openIndex + direction];
    if (next) setOpenId(next.id);
  }

  return (
    <div className="gallery-shell">
      {albums.length > 1 && (
        <div className="filters">
          {albums.map((item) => (
            <button
              key={item.id}
              className={`filter${item.id === album.id ? " is-on" : ""}`}
              type="button"
              onClick={() => {
                setAlbumId(item.id);
                setSelected([]);
                setOpenId(null);
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <header className="gallery-head">
        <p className="kicker">{album.eventType}{album.eventDate ? ` · ${album.eventDate}` : ""}</p>
        <h2>{album.title}</h2>
        {album.persons && <p className="gallery-persons">{album.persons}</p>}
        {album.description && <p className="gallery-desc">{album.description}</p>}
        <p className="gallery-welcome">
          Bienvenue. Vos photos sont prêtes : regardez-les, sélectionnez celles que vous voulez, puis téléchargez les originaux sans perte de qualité.
        </p>
      </header>

      {album.photos.length > 0 && (
        <ol className="gallery-howto">
          <li><strong>1.</strong> Parcourez la grille ou ouvrez une photo.</li>
          <li><strong>2.</strong> Cliquez sur <em>Sélectionner</em> pour chaque photo à garder (max. {album.maxPhotos}).</li>
          <li><strong>3.</strong> Cliquez sur <em>Télécharger ma sélection</em> pour recevoir un ZIP des originaux.</li>
        </ol>
      )}

      {album.photos.length === 0 && album.kind === "case" && (
        <div className="steps">
          <div className="step"><h4>Problème</h4><p>{album.probleme}</p></div>
          <div className="step"><h4>Concept</h4><p>{album.concept}</p></div>
          <div className="step"><h4>Création</h4><p>{album.creation}</p></div>
          <div className="step"><h4>Résultat</h4><p>{album.resultat}</p></div>
        </div>
      )}

      {album.photos.length > 0 && (
        <>
          <div className="gallery-bar">
            <p>Photos disponibles : {album.photos.length}</p>
            <p>Votre sélection : {state.label}</p>
            <button className="btn" type="button" disabled={busy || selected.length === 0} onClick={() => void downloadZip(selected)}>
              {busy ? "Préparation…" : "Télécharger ma sélection"}
            </button>
          </div>
          {notice && <p className="gallery-notice">{notice}</p>}
          {blocked && selected.length > 0 && (
            <p className="gallery-notice">Tu peux modifier ta sélection avant de la télécharger. Les autres photos restent visibles.</p>
          )}
          <div className="gallery-grid">
            {album.photos.map((photo) => {
              const on = selected.includes(photo.id);
              return (
                <article key={photo.id} className={`gallery-card${on ? " is-on" : ""}`}>
                  <button type="button" className="gallery-open" onClick={() => setOpenId(photo.id)}>
                    <img src={`/api/media/${photo.id}/thumb`} alt={photo.originalName} loading="lazy" decoding="async" />
                  </button>
                  <div className="gallery-actions">
                    <button type="button" onClick={() => toggle(photo.id)}>{on ? "Retirer" : "Sélectionner"}</button>
                    <a href={`/api/media/${photo.id}/original`}>Original · {formatBytes(photo.bytes)}</a>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {open && (
        <div className="overlay is-open" onClick={(event) => { if (event.target === event.currentTarget) setOpenId(null); }}>
          <article className="study gallery-lightbox">
            <img src={`/api/media/${open.id}/preview`} alt={open.originalName} />
            <div className="study-body">
              <div className="study-top">
                <div>
                  <p className="kicker">{openIndex + 1} / {album.photos.length}</p>
                  <h2>{open.originalName}</h2>
                </div>
                <button className="close" type="button" onClick={() => setOpenId(null)}>✕</button>
              </div>
              <div className="gallery-lightbox-actions">
                <button className="btn" type="button" onClick={() => step(-1)} disabled={openIndex <= 0}>Précédente</button>
                <button className="btn" type="button" onClick={() => step(1)} disabled={openIndex >= album.photos.length - 1}>Suivante</button>
                <a className="btn" href={`/api/media/${open.id}/original`}>Télécharger l’original</a>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
