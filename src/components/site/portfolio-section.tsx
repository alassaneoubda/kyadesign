"use client";

/**
 * Portfolio « Mes réalisations » : filtres, cartes et étude de cas.
 * L'affichage s'adapte aux champs réellement renseignés (tous facultatifs) :
 * aucun bloc vide, aucun lien vide, aucune valeur « null » affichée.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import type { HomeData } from "@/lib/queries";
import { joinDefined, projectSteps, studyMedia } from "@/lib/showcase";

type Project = HomeData["projects"][number];
type Category = HomeData["categories"][number];

function cardStyle(index: number): CSSProperties {
  return { ["--card-idx" as string]: index % 12 };
}

/** Révèle la grille une seule fois, quand elle entre à l'écran. */
function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      const frame = window.requestAnimationFrame(() => setRevealed(true));
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.05, rootMargin: "0px 0px 60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return { ref, revealed };
}

function ProjectCard({ project, meta, index, revealed, onOpen }: {
  project: Project;
  meta: string;
  index: number;
  revealed: boolean;
  onOpen: () => void;
}) {
  const title = project.title.trim();
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  };
  return (
    <article
      className={`card${project.cover ? "" : " is-textonly"}${revealed ? " is-visible" : ""}`}
      style={cardStyle(index)}
      role="button"
      tabIndex={0}
      aria-label={title ? `Voir la réalisation : ${title}` : "Voir la réalisation"}
      onClick={onOpen}
      onKeyDown={onKeyDown}
    >
      {project.cover ? (
        <img src={project.cover} alt={title || "Réalisation KYA Design"} loading="lazy" />
      ) : (
        <div className="card-placeholder" aria-hidden="true">
          <span>KYA</span>
        </div>
      )}
      {meta || title ? (
        <div className="card-meta">
          {meta ? <small>{meta}</small> : null}
          {title ? <h3>{title}</h3> : null}
        </div>
      ) : null}
    </article>
  );
}

function StudyOverlay({ project, onClose }: { project: Project; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const media = studyMedia(project);
  const steps = projectSteps(project);
  const kicker = joinDefined([project.clientName, project.role, project.year]);
  const title = project.title.trim();

  useEffect(() => {
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="overlay is-open"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Réalisation"}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <article className="study">
        {media.hero ? (
          <div className="study-hero">
            <img src={media.hero} alt={title || "Réalisation KYA Design"} />
          </div>
        ) : null}
        <div className="study-body">
          <div className="study-top">
            <div>
              {kicker ? <p className="kicker">{kicker}</p> : null}
              {title ? <h2>{title}</h2> : null}
            </div>
            <button className="close" type="button" onClick={onClose} ref={closeRef} aria-label="Fermer">
              ✕
            </button>
          </div>
          {project.tags.length > 0 ? (
            <ul className="study-tags" aria-label="Mots-clés">
              {project.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}
          {steps.length > 0 ? (
            <div className={`steps${steps.length === 1 ? " is-single" : ""}`}>
              {steps.map((step) => (
                <div className="step" key={step.title}>
                  <h4>{step.title}</h4>
                  <p>{step.text}</p>
                </div>
              ))}
            </div>
          ) : null}
          {media.gallery.length > 0 ? (
            <div className="study-gallery">
              {media.gallery.map((src) => (
                <img key={src} src={src} alt={title || "Réalisation KYA Design"} loading="lazy" />
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </div>,
    document.body
  );
}

/**
 * Section portfolio.
 * @param props.projects Réalisations visibles (déjà filtrées côté serveur).
 * @param props.categories Catégories (seules celles utilisées sont proposées en filtre).
 */
export function PortfolioSection({ projects, categories }: { projects: Project[]; categories: Category[] }) {
  const [category, setCategory] = useState("all");
  const [study, setStudy] = useState<Project | null>(null);
  const { ref, revealed } = useRevealOnce<HTMLDivElement>();
  const closeStudy = useCallback(() => setStudy(null), []);

  const labelOf = (id: string) => (id ? (categories.find((item) => item.id === id)?.label ?? "") : "");
  const filters = categories.filter(
    (item) => item.id === "all" || projects.some((project) => project.categoryId === item.id)
  );
  const shown = projects.filter((project) => category === "all" || project.categoryId === category);

  return (
    <section className="section section-reveal" id="realisations">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">03 — Portfolio</p>
            <h2>Mes réalisations</h2>
          </div>
        </div>
        {projects.length > 0 ? (
          <>
            {filters.length > 2 ? (
              <div className="filters" role="group" aria-label="Filtrer les réalisations">
                {filters.map((item) => (
                  <button
                    key={item.id}
                    className={`filter${category === item.id ? " is-on" : ""}`}
                    type="button"
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid" ref={ref} key={category}>
              {shown.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  meta={joinDefined([labelOf(project.categoryId), project.year])}
                  index={index}
                  revealed={revealed}
                  onOpen={() => setStudy(project)}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="empty-note">Les nouvelles réalisations arrivent bientôt.</p>
        )}
      </div>
      {study ? <StudyOverlay project={study} onClose={closeStudy} /> : null}
    </section>
  );
}
