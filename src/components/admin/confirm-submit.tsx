"use client";

/**
 * Bouton d'envoi avec confirmation navigateur, pour les suppressions définitives.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { ReactNode } from "react";

/**
 * @param props.message Question de confirmation affichée avant l'envoi.
 * @param props.children Libellé du bouton.
 */
export function ConfirmSubmit({ message, children, className }: {
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
