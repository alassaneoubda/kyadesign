"use client";

/**
 * Section contact : coordonnées, réseaux sociaux (gérés dans le back-office)
 * et formulaire de brief. Le brief est enregistré (back-office + e-mail) puis
 * prérempli dans WhatsApp. L'e-mail du visiteur est facultatif.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import { buildContactMessage, whatsappHref } from "@/lib/academy";
import type { HomeData } from "@/lib/queries";
import { socialDisplayName } from "@/lib/social";
import { submitContactAction } from "@/server/actions";
import { SocialIcon } from "./icons";

type ContactProps = Pick<HomeData, "setting" | "socialLinks">;

const PROJECT_TYPES = [
  "Création d'affiches",
  "Identité visuelle / logos",
  "Réseaux sociaux",
  "Flyers et brochures",
  "Packaging",
  "Mockups",
  "Communication publicitaire",
  "Retouche et photomontage",
  "Photographie",
  "Captation vidéo",
];

const BUDGETS = ["100–300k FCFA", "300k–1M FCFA", "1M–5M FCFA", "5M+ FCFA", "À discuter"];

const ICONS: Record<"mail" | "phone" | "pin", ReactNode> = {
  mail: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m2 7 10 7 10-7" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.37 2 2 0 0 1 3.62 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l1.86-1.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15z" />
  ),
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
};

function InfoIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <span className="cli-ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

function SocialLinks({ links }: { links: HomeData["socialLinks"] }) {
  if (links.length === 0) return null;
  return (
    <>
      <hr className="clux-sep" />
      <div className="clux-social">
        <p className="clux-social-ttl">Suivez-nous</p>
        <ul className="clux-social-row">
          {links.map((link) => {
            const name = socialDisplayName(link);
            const tip = link.handle ? `${name} · ${link.handle}` : name;
            return (
              <li key={link.id}>
                <a
                  className={`csoc csoc--${link.platform}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${tip} (nouvel onglet)`}
                  data-tip={tip}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

function ContactForm({ phone }: { phone: string }) {
  const [state, submit, pending] = useActionState(submitContactAction, null);
  const [rgpdAccepted, setRgpdAccepted] = useState(false);

  /** Ouvre WhatsApp avec le brief prérempli puis enregistre la demande (le client confirme l'envoi). */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!rgpdAccepted) return;
    const formData = new FormData(event.currentTarget);
    formData.set("rgpd", "on");
    const text = (key: string) => String(formData.get(key) ?? "");
    const brief = {
      name: text("name"),
      email: text("email"),
      phone: text("tel"),
      projectType: text("type"),
      budget: text("budget"),
      delay: text("delai"),
      message: text("message"),
    };
    window.open(whatsappHref(phone, buildContactMessage(brief)), "_blank", "noopener,noreferrer");
    submit(formData);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="cf-row">
        <div className="cf-field">
          <label htmlFor="cf-name">Nom *</label>
          <input id="cf-name" name="name" type="text" placeholder="Votre nom" autoComplete="name" required minLength={2} />
        </div>
        <div className="cf-field">
          <label htmlFor="cf-email">
            Email <span className="cf-optional">(facultatif)</span>
          </label>
          <input id="cf-email" name="email" type="email" placeholder="votre@email.com" autoComplete="email" />
        </div>
        <div className="cf-field">
          <label htmlFor="cf-tel">Téléphone</label>
          <input id="cf-tel" name="tel" type="tel" placeholder="+225 …" autoComplete="tel" />
        </div>
        <div className="cf-field">
          <label htmlFor="cf-type">Type de projet *</label>
          <div className="cf-select-wrap">
            <select id="cf-type" name="type" defaultValue="" required>
              <option value="" disabled>
                Sélectionner…
              </option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="cf-field">
          <label htmlFor="cf-budget">Budget estimé *</label>
          <div className="cf-select-wrap">
            <select id="cf-budget" name="budget" defaultValue="" required>
              <option value="" disabled>
                Sélectionner…
              </option>
              {BUDGETS.map((budget) => (
                <option key={budget} value={budget}>
                  {budget}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="cf-field">
          <label htmlFor="cf-delai">Délai souhaité</label>
          <input id="cf-delai" name="delai" type="text" placeholder="Ex: 3 semaines" />
        </div>
      </div>
      <div className="cf-field cf-full">
        <label htmlFor="cf-message">Message — Ton projet *</label>
        <textarea id="cf-message" name="message" rows={4} placeholder="Décrivez votre projet, vos objectifs, vos inspirations…" required minLength={5} />
      </div>
      <label className="cf-rgpd" htmlFor="cf-rgpd">
        <input
          id="cf-rgpd"
          type="checkbox"
          name="rgpd"
          checked={rgpdAccepted}
          onChange={(event) => setRgpdAccepted(event.target.checked)}
          required
        />
        <span>J&apos;accepte la politique de confidentialité et le traitement de mes données *</span>
      </label>
      <button className={`cf-submit${pending ? " is-pending" : ""}`} type="submit" disabled={pending}>
        {pending ? "ENVOI…" : "ENVOYER SUR WHATSAPP"}
      </button>
      <p className="cf-required-note">* Champs obligatoires</p>
      <div aria-live="polite">
        {state?.error ? <p className="bo-error cf-feedback">{state.error}</p> : null}
        {state?.ok ? (
          <p className="form-ok cf-feedback">Demande enregistrée. Confirme l&apos;envoi dans WhatsApp — réponse sous 24 h.</p>
        ) : null}
      </div>
    </form>
  );
}

/**
 * Section contact.
 * @param props.setting Coordonnées affichées.
 * @param props.socialLinks Réseaux visibles (back-office).
 */
export function ContactSection({ setting, socialLinks }: ContactProps) {
  return (
    <section className="section contact-luxury" id="contact">
      <div className="wrap">
        <div className="clux-grid">
          <div className="clux-left">
            <p className="kicker">07 — Contact</p>
            <h2 className="clux-h2">
              Travaillons
              <br />
              ensemble
            </h2>
            <p className="clux-sub">Un brief, une identité, une campagne. Écris-moi.</p>
            <ul className="clux-infos">
              <li className="cli">
                <InfoIcon name="mail" />
                <span className="cli-body">
                  <span className="cli-lbl">Email</span>
                  <a className="cli-val" href={`mailto:${setting.email}`}>
                    {setting.email}
                  </a>
                </span>
              </li>
              <li className="cli">
                <InfoIcon name="phone" />
                <span className="cli-body">
                  <span className="cli-lbl">Téléphone</span>
                  <a className="cli-val" href={`tel:${setting.phone.replace(/\s/g, "")}`}>
                    {setting.phone}
                  </a>
                </span>
              </li>
              <li className="cli">
                <span className="cli-ico cli-ico--wa" aria-hidden="true">
                  <SocialIcon platform="whatsapp" />
                </span>
                <span className="cli-body">
                  <span className="cli-lbl">WhatsApp</span>
                  <a className="cli-val" href={setting.whatsapp} target="_blank" rel="noopener noreferrer">
                    {setting.whatsappDisplay}
                  </a>
                </span>
              </li>
              <li className="cli">
                <InfoIcon name="pin" />
                <span className="cli-body">
                  <span className="cli-lbl">Localisation</span>
                  <span className="cli-val">{setting.contactLocation}</span>
                </span>
              </li>
            </ul>
            <SocialLinks links={socialLinks} />
          </div>
          <div className="clux-right">
            <div className="clux-card">
              <h3 className="clux-form-ttl">Parlons de votre projet</h3>
              <ContactForm phone={setting.phone} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
