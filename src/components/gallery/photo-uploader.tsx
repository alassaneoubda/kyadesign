"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Progress = { done: number; total: number; errors: string[] };

const WORKERS = 4;

/**
 * Envoie les photos une par une, quatre à la fois, sans les recompresser dans le navigateur.
 * @param albumId Album ouvert dans le back-office.
 */
export function PhotoUploader({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, errors: [] });
  const [running, setRunning] = useState(false);

  async function sendAll(list: FileList | null) {
    if (!list?.length || running) return;
    const files = [...list];
    setRunning(true);
    setProgress({ done: 0, total: files.length, errors: [] });
    let cursor = 0;

    async function worker() {
      while (cursor < files.length) {
        const file = files[cursor];
        cursor += 1;
        const body = new FormData();
        body.set("file", file);
        const response = await fetch(`/api/admin/albums/${albumId}/photos`, { method: "POST", body });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          setProgress((current) => ({
            ...current,
            done: current.done + 1,
            errors: [...current.errors, `${file.name} — ${payload?.message ?? "échec"}`],
          }));
        } else {
          setProgress((current) => ({ ...current, done: current.done + 1 }));
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(WORKERS, files.length) }, () => worker()));
    setRunning(false);
    router.refresh();
  }

  const ratio = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="bo-upload">
      <label className="bo-drop">
        <strong>{running ? "Envoi en cours…" : "Déposer les photos"}</strong>
        <span>JPG, PNG, WEBP ou TIFF — jusqu’à 200 fichiers, 40 Mo chacun. Les originaux sont conservés.</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/tiff"
          multiple
          disabled={running}
          onChange={(event) => {
            void sendAll(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {progress.total > 0 && (
        <div className="bo-progress" aria-live="polite">
          <div className="bo-progress-bar" style={{ width: `${ratio}%` }} />
          <p>
            {progress.done} / {progress.total}
          </p>
        </div>
      )}
      {progress.errors.length > 0 && (
        <ul className="bo-errors">
          {progress.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
