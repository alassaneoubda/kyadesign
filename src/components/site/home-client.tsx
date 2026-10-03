"use client";

/**
 * Page publique : assemble les sections et pilote les animations d'apparition.
 * Chaque section complexe vit dans son propre composant (en-tête, À propos, portfolio,
 * logiciels, témoignages, contact).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { buildAcademyMessage, whatsappHref, type AcademyKind } from "@/lib/academy";
import type { HomeData } from "@/lib/queries";
import { AboutSection } from "./about-section";
import { ContactSection } from "./contact-section";
import { PortfolioSection } from "./portfolio-section";
import { SiteHeader } from "./site-header";
import { SoftwareSection } from "./software-section";
import { TestimonialsSection } from "./testimonials-section";

type Choice = { kind: AcademyKind; title: string } | null;

/** Éléments révélés au défilement → classe ajoutée à l'entrée dans l'écran. */
const REVEAL_TARGETS: Array<[selector: string, className: string]> = [
  [".about-kya", "is-in"],
  [".clux-left", "is-in"],
  [".clux-right", "is-in"],
  [".service-kya-card", "is-visible"],
  [".academy-card", "is-visible"],
  [".academy-pack", "is-visible"],
  [".academy-mode", "is-visible"],
  [".section-reveal", "is-visible"],
  [".soft", "is-visible"],
  [".testi-card", "is-visible"],
  [".cv-card", "is-visible"],
  [".section:not(.section-reveal) > .wrap > .section-head", "is-visible"],
];

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function indexStyle(index: number): CSSProperties {
  return { ["--card-idx" as string]: index };
}

/** Révèle les éléments au défilement (une seule fois), ou immédiatement si mouvement réduit. */
function useScrollReveal(deps: unknown) {
  useEffect(() => {
    const pairs = REVEAL_TARGETS.flatMap(([selector, className]) =>
      Array.from(document.querySelectorAll(selector)).map((node) => [node, className] as const)
    );
    const classOf = new Map<Element, string>(pairs);
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      classOf.forEach((className, node) => node.classList.add(className));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(classOf.get(entry.target) ?? "is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 80px 0px" }
    );
    classOf.forEach((_className, node) => observer.observe(node));
    return () => observer.disconnect();
  }, [deps]);
}

/** Léger parallaxe de l'image hero (désactivé si mouvement réduit). */
function useHeroParallax() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const layer = document.getElementById("hero-parallax");
    if (!layer) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.max(0, Math.min(window.scrollY, window.innerHeight));
        const shift = y * (window.innerWidth < 900 ? 0.04 : 0.07);
        layer.style.transform = `translate3d(0, ${shift}px, 0)`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

/**
 * Page publique. Les classes et la structure reprennent le site statique déjà validé.
 * @param props.data Contenu public (déjà filtré côté serveur).
 */
export function HomeClient({ data }: { data: HomeData }) {
  const { setting } = data;
  const [choice, setChoice] = useState<Choice>(null);
  const [mode, setMode] = useState(data.modes[0]?.title ?? "En ligne");
  const year = new Date().getFullYear();

  useScrollReveal(data);
  useHeroParallax();

  useEffect(() => {
    if (!choice) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setChoice(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [choice]);

  function openWhatsapp() {
    if (!choice) return;
    const message = buildAcademyMessage({ ...choice, mode });
    window.open(whatsappHref(setting.phone, message), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <SiteHeader logo={setting.logoImage} />

      <section className="hero" id="top" aria-label="KYA Design Portfolio 2026">
        <div className="hero-stage">
          <div className="hero-parallax" id="hero-parallax">
            <img src={setting.heroImage} alt="KYA Design Portfolio 2026 — Yohann Armel" id="hero-img" />
          </div>
        </div>
      </section>

      <AboutSection setting={setting} facts={data.facts} skills={data.skills} />

      <section className="section-services-kya" id="services">
        <div className="services-kya-wrap">
          <div className="services-kya-header">
            <h2 className="services-kya-title">MES SERVICES</h2>
          </div>
          <div className="services-kya-grid">
            {data.services.map((service, index) => (
              <article className="service-kya-card" style={indexStyle(index)} key={service.id}>
                <div className="service-kya-img-wrap">
                  <img src={service.image} alt={service.title} loading="lazy" />
                </div>
                <div className="service-kya-body">
                  <h3 className="service-kya-card-title">{service.number} {service.title}</h3>
                  <p className="service-kya-card-text">{service.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PortfolioSection projects={data.projects} categories={data.categories} />

      <section className="section section-cv" id="cv">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">04 — Parcours professionnel</p>
              <h2>Mon CV</h2>
            </div>
            <p style={{ maxWidth: "38ch", color: "var(--muted)" }}>
              Découvrez mon parcours, mes compétences et mes expériences dans le design graphique.
            </p>
          </div>
          <div className="cv-card-container">
            <div className="cv-card">
              <div className="cv-badge-icon" aria-hidden="true">PDF</div>
              <div className="cv-info">
                <span className="cv-tag">DOCUMENT OFFICIEL · PDF</span>
                <h3 className="cv-name">CV — YOHANN ARMEL K.</h3>
                <p className="cv-role">Graphiste &amp; Directeur Créatif</p>
                <p className="cv-desc">Accédez à mon curriculum vitae officiel pour explorer mon cursus, mes compétences techniques, mes références et mes réalisations majeures.</p>
              </div>
              <div className="cv-action">
                <a className="btn cv-download-btn" href="/api/cv" download="CV_Yohann_Armel_K.pdf">
                  <span className="cv-icon-arrow">↓</span> TÉLÉCHARGER MON CV
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SoftwareSection software={data.software} />

      {data.clients.length > 0 && (
        <section className="section" id="clients">
          <div className="wrap">
            <div className="section-head">
              <div>
                <p className="kicker">06 — Collaborations</p>
                <h2>Clients</h2>
              </div>
            </div>
            <div className="clients">
              {data.clients.map((client) => (
                <div className="client" key={client.id}><strong>{client.name}</strong><span>{client.sector}</span></div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-reveal" id="academy">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">KYA Design Academy</p>
              <h2>Apprendre le design. Créer avec confiance.</h2>
            </div>
            <p style={{ maxWidth: "42ch", color: "var(--muted)" }}>
              Développez vos compétences créatives, maîtrisez les outils du design graphique et apprenez à créer des visuels professionnels grâce à des formations pratiques et adaptées à votre niveau.
            </p>
          </div>
          {data.formations.length > 0 ? (
            <div className="academy-grid">
              {data.formations.map((formation, index) => (
                <article className="academy-card" style={indexStyle(index)} key={formation.id}>
                  <div className="academy-visual"><img src={formation.image} alt={formation.title} loading="lazy" /></div>
                  <div className="academy-body">
                    <h3>{formation.title}</h3>
                    <p>{formation.summary}</p>
                    <p className="academy-learn">Ce que vous allez apprendre</p>
                    <ul>{formation.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
                    <button className="btn" type="button" onClick={() => setChoice({ kind: "formation", title: formation.title })}>Choisir cette formation</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          <div className="section-head academy-sub">
            <div>
              <p className="kicker">Parcours</p>
              <h2>Nos packs de formation</h2>
            </div>
            <p style={{ maxWidth: "36ch", color: "var(--muted)" }}>Choisissez le parcours qui correspond à vos objectifs.</p>
          </div>
          {data.packs.length > 0 ? (
            <div className="academy-packs">
              {data.packs.map((pack, index) => (
                <article className={`academy-pack${pack.highlighted ? " is-highlight" : ""}`} style={indexStyle(index)} key={pack.id}>
                  {pack.image ? (
                    <div className="academy-visual">
                      <img src={pack.image} alt={pack.title} loading="lazy" />
                    </div>
                  ) : null}
                  <div className="academy-body">
                    <h3>{pack.title}</h3>
                    <p>{pack.summary}</p>
                    <ul>{pack.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
                    <button className="btn" type="button" onClick={() => setChoice({ kind: "pack", title: pack.title })}>Choisir ce pack</button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <TestimonialsSection items={data.testimonials} />

      <ContactSection setting={setting} socialLinks={data.socialLinks} />

      <footer>
        <span>© {year} {setting.brand}</span>
        <span>{setting.footerLine}</span>
      </footer>

      {choice && (
        <div
          className="overlay is-open"
          role="dialog"
          aria-modal="true"
          aria-label={choice.title}
          onClick={(event) => { if (event.target === event.currentTarget) setChoice(null); }}
        >
          <article className="study academy-sheet">
            <div className="study-body">
              <div className="study-top">
                <div>
                  <p className="kicker">{choice.kind === "pack" ? "Pack" : "Formation"}</p>
                  <h2>{choice.title}</h2>
                </div>
                <button className="close" type="button" onClick={() => setChoice(null)} aria-label="Fermer" autoFocus>✕</button>
              </div>
              <div className="academy-choice">
                {data.modes.map((item) => (
                  <label key={item.id}>
                    <input type="radio" name="mode" checked={mode === item.title} onChange={() => setMode(item.title)} />
                    <span>{item.title}</span>
                  </label>
                ))}
              </div>
              <button className="btn" type="button" onClick={openWhatsapp}>Discutez du prix sur WhatsApp</button>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
