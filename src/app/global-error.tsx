"use client";

/**
 * Dernier filet de sécurité : erreur dans le layout racine lui-même.
 * Doit fournir ses propres <html>/<body> et ses styles (la feuille globale n'est pas chargée).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { CSSProperties } from "react";

const page: CSSProperties = {
  minHeight: "100vh",
  margin: 0,
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#0a0a0a",
  color: "#f3f1ee",
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  textAlign: "center",
};

const button: CSSProperties = {
  marginTop: 24,
  padding: "14px 26px",
  border: 0,
  background: "#ffcc00",
  color: "#111",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  cursor: "pointer",
};

/**
 * @param props.error Erreur (digest = référence dans les journaux serveur).
 * @param props.retry Relance le rendu.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={page}>
        <title>Kya Design</title>
        <div role="alert">
          <h1 style={{ fontWeight: 500, fontSize: "2rem", margin: "0 0 12px" }}>Petit contretemps</h1>
          <p style={{ margin: 0, color: "#b9b4ad" }}>La page n&apos;a pas pu se charger. Réessayez dans un instant.</p>
          <button type="button" style={button} onClick={() => retry()}>
            Réessayer
          </button>
          {error.digest ? (
            <p style={{ marginTop: 18, fontSize: 12, color: "#77726b" }}>Référence : {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
