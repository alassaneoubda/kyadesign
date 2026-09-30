"use client";

/**
 * Sélecteur d'images du back-office : optimise les photos dans le navigateur (1200 px, WebP ; HEIC,
 * JFIF, AVIF convertis), affiche les miniatures et permet de retirer une image avant l'envoi.
 * Les images choisies s'ajoutent aux précédentes (galerie) ou remplacent l'actuelle (couverture).
 * Auteur : Kya Design — 2026-09-29 — v2 (2026-09-30 : sélecteur contrôlé, miniatures)
 */
import { useEffect, useMemo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { fitWithin, isServerFormat, needsPreparation, renamedFor } from "@/lib/image-prep";
import { MAX_IMAGE_REQUEST_BYTES } from "@/lib/upload-limits";

const QUALITY = 0.9;

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/** Réduit l'image (côté max 1200 px) ; lève une erreur si le navigateur ne sait pas la lire. */
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

/** Prépare les images une à une (mémoire maîtrisée même pour 100 photos). */
async function prepareAll(chosen: File[]): Promise<{ ready: File[]; refused: string[] }> {
  const ready: File[] = [];
  const refused: string[] = [];
  for (const file of chosen) {
    try {
      ready.push(await prepareImage(file));
    } catch {
      if (isServerFormat(file) && file.size <= MAX_IMAGE_REQUEST_BYTES) ready.push(file);
      else refused.push(file.name);
    }
  }
  return { ready, refused };
}

type Props = {
  id: string;
  name: string;
  accept: string;
  multiple?: boolean;
  files: File[];
  onFilesChange: Dispatch<SetStateAction<File[]>>;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
};

/**
 * @param props.files Images prêtes (état tenu par le formulaire).
 * @param props.onFilesChange Mise à jour de la liste (ajout, retrait).
 * @param props.onBusyChange Signale l'optimisation en cours (l'envoi du formulaire attend la fin).
 */
export function ImageInput({ id, name, accept, multiple = false, files, onFilesChange, onBusyChange, disabled = false }: Props) {
  const [preparing, setPreparing] = useState(0);
  const [refused, setRefused] = useState<string[]>([]);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const chosen = Array.from(input.files ?? []);
    input.value = "";
    if (chosen.length === 0) return;
    setPreparing(chosen.length);
    onBusyChange(true);
    const { ready, refused: rejected } = await prepareAll(chosen);
    setPreparing(0);
    onBusyChange(false);
    setRefused(rejected);
    onFilesChange((current) => (multiple ? [...current, ...ready] : ready.slice(0, 1)));
  }

  const remove = (index: number) => onFilesChange((current) => current.filter((_, position) => position !== index));

  return (
    <>
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        disabled={disabled || preparing > 0}
      />
      {preparing > 0 ? (
        <small className="bo-field-note" aria-live="polite">
          Optimisation de {preparing} image{preparing > 1 ? "s" : ""}…
        </small>
      ) : null}
      {refused.length > 0 ? (
        <small className="bo-field-error" role="alert">
          Format non pris en charge, image ignorée : {refused.join(", ")}. Exporte-la en JPG puis réessaie.
        </small>
      ) : null}
      {previews.length > 0 ? (
        <ul className="bo-picks">
          {previews.map(({ file, url }, index) => (
            <li key={url}>
              {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:), non optimisable */}
              <img src={url} alt="" loading="lazy" decoding="async" />
              <button type="button" onClick={() => remove(index)} disabled={disabled} aria-label={`Retirer ${file.name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
