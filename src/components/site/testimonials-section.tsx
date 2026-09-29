"use client";

/**
 * « Nos témoignages clients » : carrousel natif (scroll-snap), balayage tactile,
 * flèches et points de navigation, défilement clavier. N'affiche que les témoignages
 * validés dans le back-office. Les visiteurs peuvent laisser leur avis (« Laisser un avis »),
 * publié seulement après validation.
 * Auteur : Kya Design — 2026-09-29 — v2
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { HomeData } from "@/lib/queries";
import { initials, joinDefined } from "@/lib/showcase";
import { UiIcon } from "./icons";
import { ReviewForm } from "./review-form";

type Testimonial = HomeData["testimonials"][number];

/** Mesure le débordement du rail et l'index de la carte la plus visible. */
function useCarousel(count: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      setOverflow(track.scrollWidth > track.clientWidth + 4);
      const cards = Array.from(track.children) as HTMLElement[];
      const center = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
        const bestCard = cards[best];
        if (bestCard && distance < Math.abs(bestCard.offsetLeft + bestCard.offsetWidth / 2 - center)) best = index;
      });
      setActive(best);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    track.addEventListener("scroll", measure, { passive: true });
    return () => {
      resize.disconnect();
      track.removeEventListener("scroll", measure);
    };
  }, [count]);

  const goTo = useCallback((index: number) => {
    const card = trackRef.current?.children[index] as HTMLElement | undefined;
    if (!card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    card.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "start" });
  }, []);

  return { trackRef, overflow, active, goTo };
}

function TestimonialCard({ item, index, total }: { item: Testimonial; index: number; total: number }) {
  const meta = joinDefined([item.role, item.company]);
  return (
    <figure
      className="testi-card"
      style={{ ["--card-idx" as string]: index % 6 } as CSSProperties}
      aria-label={`Témoignage ${index + 1} sur ${total}`}
    >
      <UiIcon name="quote" className="testi-quote-ico" />
      <blockquote className="testi-quote">
        <p>{item.quote}</p>
      </blockquote>
      <figcaption className="testi-author">
        {item.photo ? (
          <img className="testi-avatar" src={item.photo} alt="" width={56} height={56} loading="lazy" />
        ) : (
          <span className="testi-avatar is-initials" aria-hidden="true">
            {initials(item.name)}
          </span>
        )}
        <span className="testi-id">
          <strong>{item.name}</strong>
          {meta ? <span>{meta}</span> : null}
        </span>
      </figcaption>
    </figure>
  );
}

/** Appel à laisser un avis, et formulaire déplié au clic. */
function ReviewInvite({ hasItems }: { hasItems: boolean }) {
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const close = useCallback(() => setOpenedAt(null), []);

  return (
    <div className="testi-invite">
      {openedAt === null ? (
        <div className="testi-cta">
          <p>
            {hasItems
              ? "Vous avez travaillé avec Kya Design ? Votre avis compte."
              : "Vous avez travaillé avec Kya Design ? Soyez le premier à partager votre expérience."}
          </p>
          <button type="button" className="btn testi-cta-btn" onClick={() => setOpenedAt(Date.now())}>
            Laisser un avis
          </button>
        </div>
      ) : (
        <ReviewForm openedAt={openedAt} onClose={close} />
      )}
    </div>
  );
}

/**
 * Section témoignages.
 * @param props.items Témoignages visibles (filtrés côté serveur).
 */
export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  const { trackRef, overflow, active, goTo } = useCarousel(items.length);

  return (
    <section className="section testi" id="temoignages" aria-labelledby="testi-title">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">Ils nous font confiance</p>
            <h2 id="testi-title">Nos témoignages clients</h2>
          </div>
          {overflow ? (
            <div className="testi-arrows">
              <button type="button" onClick={() => goTo(Math.max(0, active - 1))} disabled={active === 0} aria-label="Témoignage précédent">
                <UiIcon name="chevron-left" />
              </button>
              <button
                type="button"
                onClick={() => goTo(Math.min(items.length - 1, active + 1))}
                disabled={active >= items.length - 1}
                aria-label="Témoignage suivant"
              >
                <UiIcon name="chevron-right" />
              </button>
            </div>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div
            className={`testi-track${overflow ? "" : " is-static"}`}
            ref={trackRef}
            tabIndex={overflow ? 0 : -1}
            role="region"
            aria-roledescription="carrousel"
            aria-label="Témoignages clients"
          >
            {items.map((item, index) => (
              <TestimonialCard key={item.id} item={item} index={index} total={items.length} />
            ))}
          </div>
        ) : null}
        {overflow ? (
          <div className="testi-dots" role="group" aria-label="Choisir un témoignage">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={index === active ? "is-on" : undefined}
                aria-label={`Afficher le témoignage ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        ) : null}
        <ReviewInvite hasItems={items.length > 0} />
      </div>
    </section>
  );
}
