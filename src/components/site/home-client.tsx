"use client";

import { useActionState, useEffect, useState } from "react";
import { buildAcademyMessage, whatsappHref, type AcademyKind } from "@/lib/academy";
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

function softwareLogo(name: string): string | null {
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
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      nodes.forEach((node) => node.classList.add(revealClass(node)));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add(revealClass(entry.target));
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12 }
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [data]);

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
            <p style={{ maxWidth: "36ch", color: "var(--muted)" }}>
              Clique une pièce pour l’étude de projet : problème, concept, création, résultat.
            </p>
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
          ) : (
            <p style={{ color: "var(--muted)", maxWidth: "48ch" }}>
              Les prochaines réalisations seront publiées ici depuis le back-office.
            </p>
          )}
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
              const logo = softwareLogo(item.name);
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
          ) : (
            <p style={{ color: "var(--muted)", maxWidth: "48ch", marginBottom: "2rem" }}>
              Les formations seront ajoutées ici depuis le back-office.
            </p>
          )}
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
          ) : (
            <p style={{ color: "var(--muted)", maxWidth: "48ch", marginBottom: "2rem" }}>
              Les modalités (en ligne / présentiel) seront publiées ici.
            </p>
          )}
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
          ) : (
            <p style={{ color: "var(--muted)", maxWidth: "48ch" }}>
              Les packs de formation seront ajoutés ici depuis le back-office.
            </p>
          )}
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
                <li className="cli"><span className="cli-ico" aria-hidden="true" /><span className="cli-body"><span className="cli-lbl">Email</span><a className="cli-val" href={`mailto:${setting.email}`}>{setting.email}</a></span></li>
                <li className="cli"><span className="cli-ico" aria-hidden="true" /><span className="cli-body"><span className="cli-lbl">Téléphone</span><a className="cli-val" href={`tel:${setting.phone.replace(/\s/g, "")}`}>{setting.phone}</a></span></li>
                <li className="cli"><span className="cli-ico cli-ico--wa" aria-hidden="true" /><span className="cli-body"><span className="cli-lbl">WhatsApp</span><a className="cli-val" href={setting.whatsapp} target="_blank" rel="noopener noreferrer">{setting.whatsappDisplay}</a></span></li>
                <li className="cli"><span className="cli-ico" aria-hidden="true" /><span className="cli-body"><span className="cli-lbl">Localisation</span><span className="cli-val">{setting.contactLocation}</span></span></li>
              </ul>
              <hr className="clux-sep" />
              <div className="clux-social">
                <p className="clux-social-ttl">Suivez-nous</p>
                <div className="clux-social-row">
                  <a className="csoc" href={setting.instagram} target="_blank" rel="noopener noreferrer"><span>Instagram · <em>{setting.instagramHandle}</em></span></a>
                  <a className="csoc" href={setting.tiktok} target="_blank" rel="noopener noreferrer"><span>TikTok · <em>{setting.tiktokHandle}</em></span></a>
                  <a className="csoc" href={setting.behance} target="_blank" rel="noopener noreferrer"><span>Behance · <em>{setting.behanceHandle}</em></span></a>
                </div>
              </div>
            </div>
            <div className="clux-right">
              <div className="clux-card">
                <h3 className="clux-form-ttl">Parlons de votre projet</h3>
                <form action={submitContact}>
                  <div className="cf-row">
                    <div className="cf-field"><label htmlFor="cf-name">Nom *</label><input id="cf-name" name="name" type="text" placeholder="Votre nom" required /></div>
                    <div className="cf-field"><label htmlFor="cf-email">Email *</label><input id="cf-email" name="email" type="email" placeholder="votre@email.com" required /></div>
                    <div className="cf-field"><label htmlFor="cf-tel">Téléphone</label><input id="cf-tel" name="tel" type="tel" placeholder="+225 …" /></div>
                    <div className="cf-field">
                      <label htmlFor="cf-type">Type de projet</label>
                      <div className="cf-select-wrap">
                        <select id="cf-type" name="type" defaultValue="">
                          <option value="">Identité visuelle / logos</option>
                          <option>Création d&apos;affiches</option>
                          <option>Identité visuelle / logos</option>
                          <option>Réseaux sociaux</option>
                          <option>Flyers et brochures</option>
                          <option>Packaging</option>
                          <option>Mockups</option>
                          <option>Communication publicitaire</option>
                          <option>Retouche et photomontage</option>
                          <option>Photographie</option>
                          <option>Captation vidéo</option>
                        </select>
                      </div>
                    </div>
                    <div className="cf-field">
                      <label htmlFor="cf-budget">Budget estimé</label>
                      <div className="cf-select-wrap">
                        <select id="cf-budget" name="budget" defaultValue="">
                          <option value="">Sélectionner…</option>
                          <option>100–300k FCFA</option>
                          <option>300k–1M FCFA</option>
                          <option>1M–5M FCFA</option>
                          <option>5M+ FCFA</option>
                          <option>À discuter</option>
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
                  <button className="cf-submit" type="submit" disabled={contactPending}>{contactPending ? "ENVOI…" : "ENVOYER"}</button>
                  {contactState?.error && <p className="bo-error">{contactState.error}</p>}
                  <p className="form-ok" style={{ display: contactState?.ok ? "block" : "none" }}>Demande envoyée. Yohann te répond sous 24 h.</p>
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
