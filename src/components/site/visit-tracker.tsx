"use client";

/**
 * Signale chaque page publique vue au compteur de visites (/api/visit).
 * N'envoie que le chemin de la page : aucune donnée personnelle, aucun service tiers.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isTrackablePath } from "@/lib/visits";

const ENDPOINT = "/api/visit";

function sendVisit(path: string): void {
  const body = new Blob([path], { type: "text/plain" });
  if (navigator.sendBeacon?.(ENDPOINT, body)) return;
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "same-origin" }).catch(() => {
    // Le compteur ne doit jamais perturber la navigation : un échec d'envoi est simplement ignoré.
  });
}

/** Composant invisible, monté une fois dans le layout racine. */
export function VisitTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (isTrackablePath(pathname)) sendVisit(pathname);
  }, [pathname]);
  return null;
}
