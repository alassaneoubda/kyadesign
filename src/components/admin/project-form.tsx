"use client";

/**
 * Formulaire « Nouvelle réalisation / Modifier la réalisation ».
 * 1. Les images sont optimisées dans le navigateur puis envoyées une par une (limite Vercel : 4,5 Mo par requête).
 * 2. Le formulaire est ensuite enregistré avec les reçus signés des images (quelques Ko).
 * Tous les champs sont facultatifs. Plafonds : 100 images et 25 Mo par soumission.
 * Erreurs et confirmation affichées près du bouton : pas de rechargement ni de retour en haut de page.
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { ImageInput } from "@/components/admin/image-input";
import { uploadProjectImages } from "@/components/admin/project-upload";
import {
  checkSubmission,
  formatMegabytes,
  MAX_IMAGES_PER_SUBMISSION,
  MAX_SUBMISSION_BYTES,
  submissionErrorMessage,
} from "@/lib/upload-limits";
import type { UploadReceipt } from "@/lib/upload-receipt";
import { saveProjectAction } from "@/server/actions";

/** Tout type d'image : le navigateur convertit (HEIC, JFIF, AVIF…) et réduit avant l'envoi. */
const IMAGE_TYPES = "image/*";

export type ProjectFormValues = {
  id: string;
  title: string;
  categoryId: string;
  year: string;
  clientName: string;
  role: string;
  tags: string;
  cover: string;
  probleme: string;
  concept: string;
  creation: string;
  resultat: string;
  sortOrder: number;
  visible: boolean;
  featured: boolean;
};

type Feedback = { tone: "error" | "ok"; text: string } | null;
type Progress = { done: number; total: number } | null;

/**
 * @param props.editing Réalisation en cours de modification, ou null pour une création.
 * @param props.categories Catégories proposées.
 * @param props.defaultSortOrder Ordre proposé pour une nouvelle réalisation.
 */
export function ProjectForm({ editing, categories, defaultSortOrder }: {
  editing: ProjectFormValues | null;
  categories: { id: string; label: string }[];
  defaultSortOrder: number;
}) {
  const router = useRouter();
  const [cover, setCover] = useState<File[]>([]);
  const [gallery, setGallery] = useState<File[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [progress, setProgress] = useState<Progress>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [saving, startSaving] = useTransition();
  const lock = useRef(false);
  const receipts = useRef(new WeakMap<File, UploadReceipt>());

  const selected = [...cover, ...gallery];
  const check = checkSubmission(selected.map((file) => file.size));
  const busy = saving || progress !== null;
  const onBusyChange = (value: boolean) => setPreparing((count) => Math.max(0, count + (value ? 1 : -1)));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current || preparing > 0) return;
    if (!check.ok) return setFeedback({ tone: "error", text: submissionErrorMessage(check) });
    lock.current = true;
    const form = event.currentTarget;
    const data = new FormData(form);
    data.delete("cover");
    data.delete("gallery");
    setFeedback(null);
    let uploaded: UploadReceipt[];
    try {
      uploaded = await uploadProjectImages(selected, receipts.current, (done, total) => setProgress({ done, total }));
    } catch (error) {
      lock.current = false;
      setProgress(null);
      const text = error instanceof Error ? error.message : "Envoi des images impossible.";
      const sentence = /[.!?…]$/.test(text) ? text : `${text}.`;
      return setFeedback({ tone: "error", text: `${sentence} Les images déjà envoyées ne seront pas renvoyées.` });
    }
    setProgress(null);
    data.set("uploads", JSON.stringify({ cover: cover.length ? uploaded[0] : null, gallery: uploaded.slice(cover.length) }));
    startSaving(async () => {
      const result = await saveProjectAction(null, data).catch(() => ({ error: "Connexion au serveur perdue. Réessaie." }));
      lock.current = false;
      if (!result || "error" in result) {
        setFeedback({ tone: "error", text: result?.error ?? "Enregistrement impossible." });
        return;
      }
      if (!editing) form.reset();
      setCover([]);
      setGallery([]);
      setFeedback({ tone: "ok", text: editing ? "Modifications enregistrées." : "Réalisation enregistrée." });
      router.refresh();
    });
  }

  const submitLabel = progress
    ? `Envoi des images ${progress.done}/${progress.total}…`
    : saving
      ? "Enregistrement…"
      : preparing > 0
        ? "Optimisation des images…"
        : editing
          ? "Enregistrer"
          : "Publier";

  return (
    <form className="bo-form" onSubmit={handleSubmit} aria-busy={busy}>
      <h2>{editing ? "Modifier la réalisation" : "Nouvelle réalisation"}</h2>
      {editing ? <input type="hidden" name="existingId" value={editing.id} /> : null}
      <fieldset className="bo-form-grid bo-fieldset" disabled={busy}>
        <ProjectTextFields editing={editing} categories={categories} />
        <div className="full bo-image-field">
          <label htmlFor="project-cover">
            Couverture {editing?.cover ? "(laisser vide pour garder l’actuelle)" : ""}
          </label>
          <ImageInput id="project-cover" name="cover" accept={IMAGE_TYPES} files={cover} onFilesChange={setCover} onBusyChange={onBusyChange} />
        </div>
        {editing?.cover ? (
          <div className="full bo-cover-preview">
            {/* eslint-disable-next-line @next/next/no-img-element -- visuel servi par l'API d'images */}
            <img src={editing.cover} alt="" />
            <label className="bo-check">
              <input type="checkbox" name="removeCover" /> Retirer la couverture
            </label>
          </div>
        ) : null}
        <div className="full bo-image-field">
          <label htmlFor="project-gallery">Ajouter des images à la galerie</label>
          <ImageInput id="project-gallery" name="gallery" accept={IMAGE_TYPES} multiple files={gallery} onFilesChange={setGallery} onBusyChange={onBusyChange} />
          <small className={check.ok ? "bo-field-note" : "bo-field-error"} aria-live="polite">
            {selected.length} / {MAX_IMAGES_PER_SUBMISSION} images · {formatMegabytes(check.bytes)} sur{" "}
            {formatMegabytes(MAX_SUBMISSION_BYTES)} (poids après optimisation)
          </small>
        </div>
        <ProjectStoryFields editing={editing} defaultSortOrder={defaultSortOrder} />
      </fieldset>
      <div className="bo-form-actions">
        <button className="btn" type="submit" disabled={busy || preparing > 0}>
          {submitLabel}
        </button>
        {editing ? (
          <a className="btn btn-ghost" href="/admin/projets" style={{ width: "auto" }}>
            Annuler
          </a>
        ) : null}
      </div>
      {progress ? (
        <div className="bo-progress bo-form-progress" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="bo-progress-bar" style={{ width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%` }} />
        </div>
      ) : null}
      {feedback ? (
        <p className={`bo-flash bo-form-feedback ${feedback.tone === "error" ? "is-error" : "is-ok"}`} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.text}
        </p>
      ) : null}
    </form>
  );
}

function ProjectTextFields({ editing, categories }: { editing: ProjectFormValues | null; categories: { id: string; label: string }[] }) {
  return (
    <>
      <label>
        Identifiant (URL)
        <input name="id" defaultValue={editing?.id ?? ""} readOnly={Boolean(editing)} placeholder="Généré depuis le titre" maxLength={60} />
      </label>
      <label>
        Année
        <input name="year" defaultValue={editing?.year ?? ""} placeholder="2026" maxLength={10} />
      </label>
      <label className="full">
        Titre
        <input name="title" defaultValue={editing?.title ?? ""} maxLength={120} />
      </label>
      <label>
        Catégorie
        <select name="categoryId" defaultValue={editing?.categoryId ?? ""}>
          <option value="">— Aucune —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Client
        <input name="clientName" defaultValue={editing?.clientName ?? ""} maxLength={120} />
      </label>
      <label className="full">
        Rôle
        <input name="role" defaultValue={editing?.role ?? ""} maxLength={160} />
      </label>
      <label className="full">
        Mots-clés, séparés par des virgules
        <input name="tags" defaultValue={editing?.tags ?? ""} maxLength={200} />
      </label>
    </>
  );
}

function ProjectStoryFields({ editing, defaultSortOrder }: { editing: ProjectFormValues | null; defaultSortOrder: number }) {
  return (
    <>
      {(["probleme", "concept", "creation", "resultat"] as const).map((field) => (
        <label className="full" key={field}>
          {STORY_LABELS[field]}
          <textarea name={field} rows={2} defaultValue={editing?.[field] ?? ""} maxLength={800} />
        </label>
      ))}
      <label>
        Ordre
        <input name="sortOrder" type="number" min={0} max={999} defaultValue={editing?.sortOrder ?? Math.min(defaultSortOrder, 999)} />
      </label>
      <div className="bo-check-group">
        <label className="bo-check">
          <input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /> Visible sur le site
        </label>
        <label className="bo-check">
          <input type="checkbox" name="featured" defaultChecked={editing?.featured ?? false} /> Mise en avant
        </label>
      </div>
    </>
  );
}

const STORY_LABELS = { probleme: "Problème", concept: "Concept", creation: "Création", resultat: "Résultat" } as const;
