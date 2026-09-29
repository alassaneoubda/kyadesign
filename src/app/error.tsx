"use client";

/**
 * Page d'erreur du site (remplace l'écran brut « This page couldn't load »).
 * Réessaie automatiquement une fois après quelques secondes (coupure passagère),
 * puis propose un bouton « Réessayer ». Aucun détail technique n'est montré au visiteur.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useEffect, useState } from "react";

const AUTO_RETRY_DELAY_MS = 2500;
const MAX_AUTO_RETRIES = 1;

let autoRetries = 0;

/**
 * @param props.error Erreur (message générique en production ; digest = référence dans les journaux).
 * @param props.retry Relance le rendu de la page.
 */
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const [autoRetrying, setAutoRetrying] = useState(autoRetries < MAX_AUTO_RETRIES);

  useEffect(() => {
    console.error("page.error", error.digest ?? "sans-digest");
    if (autoRetries >= MAX_AUTO_RETRIES) return;
    const timer = setTimeout(() => {
      autoRetries += 1;
      setAutoRetrying(false);
      retry();
    }, AUTO_RETRY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [error, retry]);

  return (
    <main className="kya-error" role="alert">
      <p className="kicker">Kya Design</p>
      <h1>Petit contretemps</h1>
      <p>
        {autoRetrying
          ? "La page met plus de temps que prévu à se charger. Nouvelle tentative en cours…"
          : "La page n'a pas pu se charger. Réessayez dans un instant."}
      </p>
      <div className="kya-error-actions">
        <button type="button" className="btn kya-error-retry" onClick={() => retry()}>
          Réessayer
        </button>
        <button type="button" className="btn" onClick={() => window.location.assign("/")}>
          Retour à l&apos;accueil
        </button>
      </div>
      {error.digest ? <small>Référence : {error.digest}</small> : null}
    </main>
  );
}
