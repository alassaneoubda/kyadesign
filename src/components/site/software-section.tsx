/**
 * « Logiciels maîtrisés » : jauges animées, sans pourcentage affiché.
 * Le niveau reste exposé aux lecteurs d'écran (role="meter").
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { CSSProperties } from "react";
import type { HomeData } from "@/lib/queries";

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
 * Section logiciels.
 * @param props.software Logiciels et niveau de maîtrise (0–100).
 */
export function SoftwareSection({ software }: { software: HomeData["software"] }) {
  return (
    <section className="section" id="logiciels">
      <div className="wrap">
        <div className="section-head">
          <div>
            <p className="kicker">05 — Outils</p>
            <h2>Logiciels maîtrisés</h2>
          </div>
        </div>
        <div className="soft">
          {software.map((item, index) => {
            const logo = softwareLogo(item.name, item.icon);
            const level = Math.max(0, Math.min(100, item.level));
            return (
              <div className="soft-row" key={item.id} style={{ ["--i" as string]: index } as CSSProperties}>
                <div className="soft-name">
                  {logo ? <img className="soft-logo" src={logo} alt="" width={36} height={36} /> : null}
                  <span>{item.name}</span>
                </div>
                <div
                  className="bar"
                  role="meter"
                  aria-label={`Maîtrise de ${item.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={level}
                >
                  <span style={{ ["--level" as string]: level / 100 } as CSSProperties} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
