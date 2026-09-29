"use client";

/**
 * Bouton « œil » : affiche / masque un contenu sur le site public sans jamais le supprimer.
 * Mise à jour optimiste, retour visuel (toast) en cas de succès comme d'échec ;
 * l'autorisation et la persistance sont assurées côté serveur (toggleVisibilityAction).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useActionState, useEffect, useOptimistic, useState } from "react";
import { UiIcon } from "@/components/site/icons";
import { toggleVisibilityAction } from "@/server/showcase-actions";

type Entity = "project" | "social" | "testimonial";

const TOAST_MS = 3200;

/**
 * @param props.entity Type de contenu.
 * @param props.id Identifiant du contenu.
 * @param props.visible État actuel en base.
 * @param props.label Nom lisible du contenu (infobulle / lecteurs d'écran).
 */
export function VisibilityToggle({ entity, id, visible, label }: {
  entity: Entity;
  id: string;
  visible: boolean;
  label: string;
}) {
  const [state, action, pending] = useActionState(toggleVisibilityAction, null);
  const [shown, setShown] = useOptimistic(visible);
  const [dismissedAt, setDismissedAt] = useState(0);

  useEffect(() => {
    if (!state) return;
    const timer = window.setTimeout(() => setDismissedAt(state.at), TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const title = shown ? `Visible sur le site — cliquer pour masquer « ${label} »` : `Masqué — cliquer pour afficher « ${label} »`;

  return (
    <form
      className="bo-eye-form"
      action={(formData) => {
        setShown(!shown);
        action(formData);
      }}
    >
      <input type="hidden" name="entity" value={entity} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="visible" value={String(!shown)} />
      <button
        type="submit"
        className={`bo-eye${shown ? " is-on" : " is-off"}${pending ? " is-pending" : ""}`}
        title={title}
        aria-label={title}
        aria-pressed={shown}
        disabled={pending}
      >
        <UiIcon name={shown ? "eye" : "eye-off"} />
        <span>{shown ? "Visible" : "Masqué"}</span>
      </button>
      {state && state.at !== dismissedAt ? (
        <p className={`bo-toast${state.ok ? " is-ok" : " is-error"}`} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
