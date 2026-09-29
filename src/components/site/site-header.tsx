"use client";

/**
 * En-tête du site : navigation par ancres avec section active, menu mobile animé
 * et accès « Admin » (l'autorisation reste contrôlée côté serveur par /admin).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { useEffect, useState } from "react";
import { UiIcon } from "./icons";

const NAV_LINKS = [
  { href: "#top", label: "Accueil" },
  { href: "#a-propos", label: "À propos" },
  { href: "#services", label: "Services" },
  { href: "#realisations", label: "Portfolio" },
  { href: "#cv", label: "CV" },
  { href: "#logiciels", label: "Compétences" },
  { href: "#academy", label: "Academy" },
  { href: "/galerie", label: "Albums" },
  { href: "#contact", label: "Contact" },
] as const;

const SECTION_IDS = NAV_LINKS.filter((link) => link.href.startsWith("#")).map((link) => link.href.slice(1));

/** Suit la section visible au centre de l'écran pour surligner le lien correspondant. */
function useActiveSection(): string {
  const [active, setActive] = useState("top");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    SECTION_IDS.forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

/**
 * En-tête public.
 * @param props.logo URL du logo.
 */
export function SiteHeader({ logo }: { logo: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className={`nav${scrolled ? " is-scrolled" : ""}${menuOpen ? " is-menu-open" : ""}`} id="nav">
      <a className="logo" href="#top" aria-label="KYA Design — Accueil">
        <img src={logo} alt="KYA Designer" width={220} height={80} />
      </a>
      <nav className={`nav-links${menuOpen ? " is-open" : ""}`} id="nav-links" aria-label="Navigation principale">
        {NAV_LINKS.map((link) => {
          const isActive = link.href === `#${active}`;
          const isContact = link.href === "#contact";
          return (
            <a
              key={link.href}
              href={link.href}
              className={`nav-link${isActive ? " is-active" : ""}${isContact ? " nav-contact" : ""}`}
              aria-current={isActive ? "true" : undefined}
              onClick={close}
            >
              {link.label}
            </a>
          );
        })}
        <a className="nav-admin" href="/admin" onClick={close} aria-label="Admin — accès au back-office">
          <UiIcon name="lock" />
          <span>Admin</span>
        </a>
      </nav>
      <button
        className="burger"
        id="burger"
        type="button"
        aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={menuOpen}
        aria-controls="nav-links"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="burger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>
    </header>
  );
}
