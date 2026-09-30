/**
 * Section « À propos » — reproduction de la maquette validée :
 * panneau sombre + portrait à gauche (sans forme ni cadre), présentation claire à droite.
 * Contenu 100 % piloté par le back-office (réglages, chiffres clés, compétences).
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { CSSProperties } from "react";
import type { HomeData } from "@/lib/queries";
import { factIconFor, roleBadgeLines, skillIconFor, splitDisplayName } from "@/lib/showcase";
import { UiIcon } from "./icons";

type AboutProps = Pick<HomeData, "setting" | "facts" | "skills">;

function stagger(index: number): CSSProperties {
  return { ["--i" as string]: index };
}

/**
 * Section « À propos ».
 * @param props.setting Réglages du site (nom, rôle, textes, portrait, accroche).
 * @param props.facts Chiffres clés.
 * @param props.skills Compétences.
 */
export function AboutSection({ setting, facts, skills }: AboutProps) {
  const name = splitDisplayName(setting.aboutName);
  const badge = roleBadgeLines(setting.aboutRole);
  const tagline = setting.aboutTagline.trim();
  const paragraphs = [setting.aboutIntro, setting.aboutApproach, setting.aboutExperience]
    .map((text) => text.trim())
    .filter(Boolean);
  let order = 0;

  return (
    <section className="about-kya" id="a-propos" aria-labelledby="about-kya-title">
      <div className="about-kya-visual">
        {tagline ? (
          <p className="about-kya-tagline">
            <span>{tagline}</span>
            <svg className="about-kya-swoosh" viewBox="0 0 200 22" aria-hidden="true" focusable="false">
              <path d="M4 17 C 58 7, 122 4, 196 3" />
            </svg>
          </p>
        ) : null}

        <div className={`about-kya-figure ${setting.portraitCutout ? "is-cutout" : "is-photo"}`}>
          {setting.portraitImage ? (
            <div className="about-kya-portrait">
              <img
                src={setting.portraitImage}
                alt={`${setting.aboutName}${badge.length ? `, ${badge.join(" ")}` : ""} — KYA Design`}
                width={960}
                height={1280}
              />
            </div>
          ) : null}
        </div>

        {badge.length > 0 ? (
          <p className="about-kya-badge">
            <span className="about-kya-badge-ico">
              <UiIcon name="arrow-up-right" />
            </span>
            <span>
              {badge.map((line) => (
                <span className="about-kya-badge-line" key={line}>
                  {line}
                </span>
              ))}
            </span>
          </p>
        ) : null}
      </div>

      <div className="about-kya-content">
        <p className="about-kya-kicker about-kya-item" style={stagger(order++)}>
          Présentation
        </p>
        <h2 className="about-kya-name about-kya-item" id="about-kya-title" style={stagger(order++)}>
          {name.first}
          {name.rest ? <span className="is-accent"> {name.rest}</span> : null}
        </h2>
        {setting.aboutRole.trim() ? (
          <p className="about-kya-role about-kya-item" style={stagger(order++)}>
            {setting.aboutRole}
          </p>
        ) : null}
        {paragraphs.map((text) => (
          <p className="about-kya-text about-kya-item" style={stagger(order++)} key={text.slice(0, 40)}>
            {text}
          </p>
        ))}

        {facts.length > 0 ? (
          <ul className="about-kya-facts about-kya-item" style={stagger(order++)}>
            {facts.map((fact, index) => (
              <li className="about-kya-fact" key={fact.id}>
                <span className="about-kya-fact-ico">
                  <UiIcon name={factIconFor(fact.label, index)} />
                </span>
                <span className="about-kya-fact-body">
                  <strong>{fact.value}</strong>
                  <span>{fact.label}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {skills.length > 0 ? (
          <>
            <p className="about-kya-kicker is-small about-kya-item" style={stagger(order++)}>
              Compétences
            </p>
            <ul className="about-kya-skills about-kya-item" style={stagger(order++)}>
              {skills.map((skill) => (
                <li className="about-kya-skill" key={skill.id}>
                  <UiIcon name={skillIconFor(skill.label)} />
                  <span>{skill.label}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </section>
  );
}
