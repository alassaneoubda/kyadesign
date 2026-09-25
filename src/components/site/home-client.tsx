"use client";

import { useActionState, useEffect, useState, type FormEvent } from "react";
import {
  buildAcademyMessage,
  buildContactMessage,
  whatsappHref,
  type AcademyKind,
} from "@/lib/academy";
import type { HomeData } from "@/lib/queries";
import { submitContactAction } from "@/server/actions";

type Project = HomeData["projects"][number];
type Choice = { kind: AcademyKind; title: string } | null;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const SOFTWARE_LOGOS: Record<string, string> = {
  photoshop: "/assets/software/photoshop.svg",
  illustrator: "/assets/software/illustrator.svg",
  "after effects": "/assets/software/after-effects.svg",
  "premiere pro": "/assets/software/premiere-pro.svg",
  indesign: "/assets/software/indesign.svg",
  figma: "/assets/software/figma.svg",
};

function softwareLogo(name: string, icon?: string): string | null {
  if (icon) return icon;
  return SOFTWARE_LOGOS[name.trim().toLowerCase()] ?? null;
}

/**
 * Page publique. Les classes et la structure reprennent le site statique déjà validé.
 */
export function HomeClient({ data }: { data: HomeData }) {
  const { setting } = data;
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [category, setCategory] = useState("all");
  const [study, setStudy] = useState<Project | null>(null);
  const [choice, setChoice] = useState<Choice>(null);
  const [mode, setMode] = useState(data.modes[0]?.title ?? "En ligne");
  const [contactState, submitContact, contactPending] = useActionState(submitContactAction, null);
  const year = new Date().getFullYear();

  /**
   * Enregistre la demande (BO + e-mail) et ouvre WhatsApp avec le brief prérempli.
   * Le client doit encore appuyer sur Envoyer dans WhatsApp.
   */
  function handleContactSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const brief = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("tel") ?? ""),
      projectType: String(formData.get("type") ?? ""),
      budget: String(formData.get("budget") ?? ""),
      delay: String(formData.get("delai") ?? ""),
      message: String(formData.get("message") ?? ""),
    };
    window.open(
      whatsappHref(setting.phone, buildContactMessage(brief)),
      "_blank",
      "noopener,noreferrer",
    );
    submitContact(formData);
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const layer = document.getElementById("hero-parallax");
    if (!layer) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = window.innerHeight;
        const y = Math.max(0, Math.min(window.scrollY, max));
        const shift = y * (window.innerWidth < 900 ? 0.04 : 0.07);
        layer.style.transform = `translate3d(0, ${shift}px, 0)`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll(
      ".about-grid, .service-kya-card, .clux-left, .clux-right, .academy-card, .academy-pack, .academy-mode, .section-reveal, .card"
    );
    const revealClass = (node: Element) =>
      node.classList.contains("service-kya-card") ||
      node.classList.contains("academy-card") ||
      node.classList.contains("academy-pack") ||
      node.classList.contains("academy-mode") ||
      node.classList.contains("section-reveal") ||
      node.classList.contains("card")
        ? "is-visible"
        : "is-in";

    const revealNow = (node: Element) => {
      node.classList.add(revealClass(node));
    };

    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      nodes.forEach(revealNow);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealNow(entry.target);
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 80px 0px" }
    );

    nodes.forEach((node) => {
      // Après un filtre, les cartes sont recréées : les rendre visibles si déjà à l'écran.
      if (node.classList.contains("card")) {
        const rect = node.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
          revealNow(node);
          return;
        }
      }
      io.observe(node);
    });

    return () => io.disconnect();
  }, [data, category]);

  const projects = data.projects.filter((project) => category === "all" || project.categoryId === category);
  const categoryLabel = (id: string) => data.categories.find((item) => item.id === id)?.label ?? id;

  function openWhatsapp() {
    if (!choice) return;
    const message = buildAcademyMessage({ ...choice, mode });
    window.open(whatsappHref(setting.phone, message), "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <header className={`nav${scrolled ? " is-scrolled" : ""}`} id="nav">
        <a className="logo" href="#top" aria-label="KYA Design — Accueil">
          <img src={setting.logoImage} alt="KYA Designer" width={220} height={80} />
        </a>
        <nav className={`nav-links${menuOpen ? " is-open" : ""}`} id="nav-links">
          <a href="#top" onClick={() => setMenuOpen(false)}>Accueil</a>
          <a href="#a-propos" onClick={() => setMenuOpen(false)}>À propos</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#realisations" onClick={() => setMenuOpen(false)}>Portfolio</a>
          <a href="#cv" onClick={() => setMenuOpen(false)}>CV</a>
          <a href="#logiciels" onClick={() => setMenuOpen(false)}>Compétences</a>
          <a href="#academy" onClick={() => setMenuOpen(false)}>Academy</a>
          <a href="/galerie" onClick={() => setMenuOpen(false)}>Albums</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button className="burger" id="burger" aria-label="Menu" type="button" onClick={() => setMenuOpen((open) => !open)}>☰</button>
      </header>

      <section className="hero" id="top" aria-label="KYA Design Portfolio 2026">
        <div className="hero-stage">
          <div className="hero-parallax" id="hero-parallax">
            <img src={setting.heroImage} alt="KYA Design Portfolio 2026 — Yohann Armel Koukoui" id="hero-img" />
          </div>
        </div>
      </section>

      <section className="section" id="a-propos">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">01 — À propos</p>
              <h2>Qui suis-je ?</h2>
            </div>
          </div>
          <div className="about-grid" id="about-panel">
            <figure className="about-photo">
              <img src={setting.portraitImage} alt="Yohann Armel, graphiste et directeur créatif — KYA Design" width={900} height={1200} />
            </figure>
            <div className="about-text">
              <p className="kicker">Présentation</p>
              <h3 className="about-name">{setting.aboutName}</h3>
              <p className="about-role">{setting.aboutRole}</p>
              <p>{setting.aboutIntro}</p>
              <p>{setting.aboutApproach}</p>
              <p>{setting.aboutExperience}</p>
              <div className="facts">
                {data.facts.map((fact) => (
                  <div className="fact" key={fact.label}><strong>{fact.value}</strong><span>{fact.label}</span></div>
                ))}
              </div>
              <div className="skill-list">
                {data.skills.map((skill) => <span className="chip" key={skill.id}>{skill.label}</span>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-services-kya" id="services">
        <div className="services-kya-wrap">
          <div className="services-kya-header">
            <h2 className="services-kya-title">MES SERVICES</h2>
          </div>
          <div className="services-kya-grid">
            {data.services.map((service, index) => (
              <article className="service-kya-card" style={{ ["--card-idx" as string]: index }} key={service.id}>
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

      <section className="section section-reveal" id="realisations">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">03 — Portfolio</p>
              <h2>Mes réalisations</h2>
            </div>
          </div>
          {data.projects.length > 0 ? (
            <>
              <div className="filters">
                {data.categories.map((item) => (
                  <button key={item.id} className={`filter${category === item.id ? " is-on" : ""}`} type="button" onClick={() => setCategory(item.id)}>
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="grid">
                {projects.map((project) => (
                  <article className="card" key={project.id} onClick={() => setStudy(project)}>
                    <img src={project.cover} alt={project.title} />
                    <div className="card-meta">
                      <small>{categoryLabel(project.categoryId)} · {project.year}</small>
                      <h3>{project.title}</h3>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}
          <a className="btn lock-note" href="/galerie">Accès client — albums privés</a>
        </div>
      </section>

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

      <section className="section" id="logiciels">
        <div className="wrap">
          <div className="section-head">
            <div>
              <p className="kicker">05 — Outils</p>
              <h2>Logiciels maîtrisés</h2>
            </div>
          </div>
          <div className="soft">
            {data.software.map((item) => {
              const logo = softwareLogo(item.name, item.icon);
              return (
                <div className="soft-row" key={item.id}>
                  <div className="soft-name">
                    {logo ? <img className="soft-logo" src={logo} alt="" width={36} height={36} /> : null}
                    <span>{item.name}</span>
                  </div>
                  <div className="bar"><span style={{ width: `${item.level}%` }} /></div>
                  <span>{item.level}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

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
                <article className="academy-card" style={{ ["--card-idx" as string]: index }} key={formation.id}>
                  <div className="academy-visual"><img src={formation.image} alt={formation.title} /></div>
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
              <p className="kicker">Modalités</p>
              <h2>Choisissez votre mode de formation</h2>
            </div>
          </div>
          {data.modes.length > 0 ? (
            <div className="academy-modes">
              {data.modes.map((item) => (
                <article className="academy-mode" key={item.id}>
                  <img src={item.image} alt="" />
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.lead}</p>
                    <p>{item.detail}</p>
                    <ul>{item.includes.map((line) => <li key={line}>{line}</li>)}</ul>
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
                <article className={`academy-pack${pack.highlighted ? " is-highlight" : ""}`} style={{ ["--card-idx" as string]: index }} key={pack.id}>
                  {pack.image ? (
                    <div className="academy-visual">
                      <img src={pack.image} alt={pack.title} />
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

      <section className="section contact-luxury" id="contact">
        <div className="wrap">
          <div className="clux-grid">
            <div className="clux-left">
              <p className="kicker">07 — Contact</p>
              <h2 className="clux-h2">Travaillons<br />ensemble</h2>
              <p className="clux-sub">Un brief, une identité, une campagne. Écris-moi.</p>
              <ul className="clux-infos">
                <li className="cli">
                  <span className="cli-ico" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m2 7 10 7 10-7" />
                    </svg>
                  </span>
                  <span className="cli-body">
                    <span className="cli-lbl">Email</span>
                    <a className="cli-val" href={`mailto:${setting.email}`}>{setting.email}</a>
                  </span>
                </li>
                <li className="cli">
                  <span className="cli-ico" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.37 2 2 0 0 1 3.62 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6 6l1.86-1.86a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15z" />
                    </svg>
                  </span>
                  <span className="cli-body">
                    <span className="cli-lbl">Téléphone</span>
                    <a className="cli-val" href={`tel:${setting.phone.replace(/\s/g, "")}`}>{setting.phone}</a>
                  </span>
                </li>
                <li className="cli">
                  <span className="cli-ico cli-ico--wa" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.12 1.535 5.845L.057 23.448a.5.5 0 0 0 .61.61l5.603-1.478A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.9a9.878 9.878 0 0 1-5.032-1.376l-.36-.214-3.733.984.993-3.63-.234-.373A9.87 9.87 0 0 1 2.1 12C2.1 6.532 6.532 2.1 12 2.1c5.468 0 9.9 4.432 9.9 9.9 0 5.468-4.432 9.9-9.9 9.9z" />
                    </svg>
                  </span>
                  <span className="cli-body">
                    <span className="cli-lbl">WhatsApp</span>
                    <a className="cli-val" href={setting.whatsapp} target="_blank" rel="noopener noreferrer">{setting.whatsappDisplay}</a>
                  </span>
                </li>
                <li className="cli">
                  <span className="cli-ico" aria-hidden="true">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </span>
                  <span className="cli-body">
                    <span className="cli-lbl">Localisation</span>
                    <span className="cli-val">{setting.contactLocation}</span>
                  </span>
                </li>
              </ul>
              <hr className="clux-sep" />
              <div className="clux-social">
                <p className="clux-social-ttl">Suivez-nous</p>
                <div className="clux-social-row">
                  <a className="csoc" href={setting.instagram} target="_blank" rel="noopener noreferrer"><span>Instagram · <em>{setting.instagramHandle}</em></span></a>
                  <a className="csoc" href={setting.tiktok} target="_blank" rel="noopener noreferrer"><span>TikTok · <em>{setting.tiktokHandle}</em></span></a>
                  <a className="csoc" href={setting.behance} target="_blank" rel="noopener noreferrer"><span>Behance · <em>{setting.behanceHandle}</em></span></a>
                  {setting.linkedin ? (
                    <a className="csoc" href={setting.linkedin} target="_blank" rel="noopener noreferrer">
                      <span>LinkedIn · <em>{setting.linkedinHandle || "LinkedIn"}</em></span>
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="clux-right">
              <div className="clux-card">
                <h3 className="clux-form-ttl">Parlons de votre projet</h3>
                <form onSubmit={handleContactSubmit}>
                  <div className="cf-row">
                    <div className="cf-field"><label htmlFor="cf-name">Nom *</label><input id="cf-name" name="name" type="text" placeholder="Votre nom" required /></div>
                    <div className="cf-field"><label htmlFor="cf-email">Email *</label><input id="cf-email" name="email" type="email" placeholder="votre@email.com" required /></div>
                    <div className="cf-field"><label htmlFor="cf-tel">Téléphone</label><input id="cf-tel" name="tel" type="tel" placeholder="+225 …" /></div>
                    <div className="cf-field">
                      <label htmlFor="cf-type">Type de projet *</label>
                      <div className="cf-select-wrap">
                        <select id="cf-type" name="type" defaultValue="" required>
                          <option value="" disabled>
                            Sélectionner…
                          </option>
                          <option value="Création d'affiches">Création d&apos;affiches</option>
                          <option value="Identité visuelle / logos">Identité visuelle / logos</option>
                          <option value="Réseaux sociaux">Réseaux sociaux</option>
                          <option value="Flyers et brochures">Flyers et brochures</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Mockups">Mockups</option>
                          <option value="Communication publicitaire">Communication publicitaire</option>
                          <option value="Retouche et photomontage">Retouche et photomontage</option>
                          <option value="Photographie">Photographie</option>
                          <option value="Captation vidéo">Captation vidéo</option>
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
                          <option value="100–300k FCFA">100–300k FCFA</option>
                          <option value="300k–1M FCFA">300k–1M FCFA</option>
                          <option value="1M–5M FCFA">1M–5M FCFA</option>
                          <option value="5M+ FCFA">5M+ FCFA</option>
                          <option value="À discuter">À discuter</option>
                        </select>
                      </div>
                    </div>
                    <div className="cf-field"><label htmlFor="cf-delai">Délai souhaité</label><input id="cf-delai" name="delai" type="text" placeholder="Ex: 3 semaines" /></div>
                  </div>
                  <div className="cf-field cf-full">
                    <label htmlFor="cf-message">Message — Ton projet *</label>
                    <textarea id="cf-message" name="message" rows={4} placeholder="Décrivez votre projet, vos objectifs, vos inspirations…" required />
                  </div>
                  <label className="cf-rgpd"><input type="checkbox" name="rgpd" required /><span>J&apos;accepte la politique de confidentialité et le traitement de mes données *</span></label>
                  <button className="cf-submit" type="submit" disabled={contactPending}>
                    {contactPending ? "ENVOI…" : "ENVOYER SUR WHATSAPP"}
                  </button>
                  {contactState?.error && <p className="bo-error">{contactState.error}</p>}
                  <p className="form-ok" style={{ display: contactState?.ok ? "block" : "none" }}>
                    Demande enregistrée. Confirme l&apos;envoi dans WhatsApp — réponse sous 24 h.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <span>© {year} {setting.brand}</span>
        <span>{setting.footerLine}</span>
      </footer>

      {study && (
        <div className="overlay is-open" onClick={(event) => { if (event.target === event.currentTarget) setStudy(null); }}>
          <article className="study">
            <div className="study-hero"><img src={study.cover} alt={study.title} /></div>
            <div className="study-body">
              <div className="study-top">
                <div>
                  <p className="kicker">{study.clientName} · {study.role} · {study.year}</p>
                  <h2>{study.title}</h2>
                </div>
                <button className="close" type="button" onClick={() => setStudy(null)}>✕</button>
              </div>
              <div className="steps">
                <div className="step"><h4>Problème</h4><p>{study.probleme}</p></div>
                <div className="step"><h4>Concept</h4><p>{study.concept}</p></div>
                <div className="step"><h4>Création</h4><p>{study.creation}</p></div>
                <div className="step"><h4>Résultat</h4><p>{study.resultat}</p></div>
              </div>
              <div className="study-gallery">
                {(study.gallery.length ? study.gallery : [study.cover]).map((src) => <img key={src} src={src} alt={study.title} />)}
              </div>
            </div>
          </article>
        </div>
      )}

      {choice && (
        <div className="overlay is-open" onClick={(event) => { if (event.target === event.currentTarget) setChoice(null); }}>
          <article className="study academy-sheet">
            <div className="study-body">
              <div className="study-top">
                <div>
                  <p className="kicker">{choice.kind === "pack" ? "Pack" : "Formation"}</p>
                  <h2>{choice.title}</h2>
                </div>
                <button className="close" type="button" onClick={() => setChoice(null)}>✕</button>
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
