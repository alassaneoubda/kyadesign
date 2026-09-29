"use client";

/**
 * Champ image du back-office : réduit et convertit les photos dans le navigateur avant l'envoi
 * (limite de 4,5 Mo par requête chez l'hébergeur, formats HEIC/JFIF/AVIF refusés par le serveur).
 * Bloque l'envoi du formulaire si le total reste trop lourd, avec un message clair.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useState, type ChangeEvent } from "react";
import { fitWithin, isServerFormat, needsPreparation, renamedFor, REQUEST_BUDGET_BYTES } from "@/lib/image-prep";

type Status = { tone: "info" | "error"; text: string } | null;

const QUALITY = 0.85;
const MB = 1024 * 1024;

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Réduit l'image (côté max 1800 px) ; lève une erreur si le navigateur ne sait pas la lire. */
async function prepareImage(file: File): Promise<File> {
  if (!needsPreparation(file)) return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await toBlob(canvas, "image/webp");
  if (!blob) throw new Error("conversion impossible");
  return new File([blob], renamedFor(file.name, blob.type), { type: blob.type, lastModified: Date.now() });
}

/** Poids total des images déjà choisies dans tout le formulaire. */
function formFilesBytes(form: HTMLFormElement | null): number {
  if (!form) return 0;
  return Array.from(form.querySelectorAll<HTMLInputElement>('input[type="file"]'))
    .flatMap((input) => Array.from(input.files ?? []))
    .reduce((total, file) => total + file.size, 0);
}

/**
 * @param props.name Nom du champ envoyé au serveur.
 * @param props.accept Types proposés dans le sélecteur de fichiers.
 * @param props.multiple Autorise plusieurs images.
 */
export function ImageInput({ name, accept, multiple = false }: { name: string; accept: string; multiple?: boolean }) {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const chosen = Array.from(input.files ?? []);
    input.form?.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((field) => field.setCustomValidity(""));
    input.setCustomValidity("");
    if (chosen.length === 0) return setStatus(null);

    setBusy(true);
    setStatus({ tone: "info", text: "Préparation des images…" });
    const ready: File[] = [];
    const refused: string[] = [];
    for (const file of chosen) {
      try {
        ready.push(await prepareImage(file));
      } catch {
        if (isServerFormat(file) && file.size <= REQUEST_BUDGET_BYTES) ready.push(file);
        else refused.push(file.name);
      }
    }
    const transfer = new DataTransfer();
    ready.forEach((file) => transfer.items.add(file));
    input.files = transfer.files;
    setBusy(false);

    const total = formFilesBytes(input.form);
    const problems: string[] = [];
    if (refused.length > 0) {
      problems.push(`Format non pris en charge, image ignorée : ${refused.join(", ")}. Exporte-la en JPG puis réessaie.`);
    }
    if (total > REQUEST_BUDGET_BYTES) {
      const message = `Images trop lourdes pour un seul envoi (${(total / MB).toFixed(1)} Mo, 4 Mo maximum). Ajoute-les en plusieurs fois.`;
      input.setCustomValidity(message);
      problems.push(message);
    }
    if (problems.length > 0) return setStatus({ tone: "error", text: problems.join(" ") });
    setStatus({
      tone: "info",
      text: `${ready.length} image${ready.length > 1 ? "s" : ""} prête${ready.length > 1 ? "s" : ""} (${(total / MB).toFixed(1)} Mo).`,
    });
  }

  return (
    <>
      <input name={name} type="file" accept={accept} multiple={multiple} onChange={handleChange} disabled={busy} />
      {status ? (
        <small className={status.tone === "error" ? "bo-field-error" : "bo-field-note"} aria-live="polite">
          {status.text}
        </small>
      ) : null}
    </>
  );
}
