"use client";

/**
 * Formulaire « Laisser un avis » : le visiteur envoie son témoignage, publié après validation
 * par l'administrateur. Contient un champ piège invisible (anti-robots).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useActionState, useEffect, useRef } from "react";
import { submitReviewAction } from "@/server/review-actions";

/**
 * @param props.openedAt Horodatage (ms) de l'ouverture du formulaire (contrôle anti-robots).
 * @param props.onClose Ferme le formulaire.
 */
export function ReviewForm({ openedAt, onClose }: { openedAt: number; onClose: () => void }) {
  const [state, submit, pending] = useActionState(submitReviewAction, null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus({ preventScroll: true });
  }, []);

  if (state?.ok) {
    return (
      <div className="clux-card testi-form-card is-done" role="status">
        <h3 className="clux-form-ttl">Merci pour votre avis !</h3>
        <p className="testi-form-lead">
          Il a bien été reçu et sera publié sur le site après validation. Merci pour votre confiance.
        </p>
        <button type="button" className="btn testi-form-close" onClick={onClose}>
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form className="clux-card testi-form-card" action={submit} aria-labelledby="testi-form-title">
      <h3 className="clux-form-ttl" id="testi-form-title">
        Partagez votre expérience
      </h3>
      <p className="testi-form-lead">Votre avis sera publié après une rapide validation.</p>
      <input type="hidden" name="openedAt" value={openedAt} />
      <div className="testi-hp" aria-hidden="true">
        <label htmlFor="rv-website">Ne pas remplir</label>
        <input id="rv-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="cf-row">
        <div className="cf-field cf-full">
          <label htmlFor="rv-name">Nom *</label>
          <input
            ref={nameRef}
            id="rv-name"
            name="name"
            type="text"
            placeholder="Votre nom ou prénom"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
          />
        </div>
        <div className="cf-field">
          <label htmlFor="rv-role">
            Fonction <span className="cf-optional">(facultatif)</span>
          </label>
          <input id="rv-role" name="role" type="text" placeholder="Ex : Gérante" maxLength={120} />
        </div>
        <div className="cf-field">
          <label htmlFor="rv-company">
            Entreprise <span className="cf-optional">(facultatif)</span>
          </label>
          <input id="rv-company" name="company" type="text" autoComplete="organization" maxLength={120} />
        </div>
      </div>
      <div className="cf-field cf-full">
        <label htmlFor="rv-quote">Votre avis *</label>
        <textarea
          id="rv-quote"
          name="quote"
          rows={4}
          placeholder="Comment s'est passée votre collaboration avec Kya Design ?"
          required
          minLength={20}
          maxLength={800}
        />
      </div>
      <label className="cf-rgpd" htmlFor="rv-consent">
        <input id="rv-consent" type="checkbox" name="consent" required />
        <span>J&apos;accepte que mon nom et mon avis soient publiés sur ce site *</span>
      </label>
      <div className="testi-form-actions">
        <button className={`cf-submit${pending ? " is-pending" : ""}`} type="submit" disabled={pending}>
          {pending ? "ENVOI…" : "ENVOYER MON AVIS"}
        </button>
        <button type="button" className="btn testi-form-close" onClick={onClose} disabled={pending}>
          Annuler
        </button>
      </div>
      <p className="cf-required-note">* Champs obligatoires</p>
      <div aria-live="polite">{state?.error ? <p className="bo-error cf-feedback">{state.error}</p> : null}</div>
    </form>
  );
}
