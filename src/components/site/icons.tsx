/**
 * Pictogrammes SVG inline (aucune dépendance) : logos des réseaux et icônes d'interface.
 * Tous décoratifs (aria-hidden) : le nom accessible est porté par le lien ou le bouton parent.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { ReactNode } from "react";
import type { FactIcon, SkillIcon } from "@/lib/showcase";
import { SOCIAL_ICON_PATHS } from "@/lib/social-icon-paths";

type IconProps = { className?: string };

export type UiIconName =
  | SkillIcon
  | FactIcon
  | "arrow-up-right"
  | "lock"
  | "eye"
  | "eye-off"
  | "quote"
  | "chevron-left"
  | "chevron-right"
  | "link";

const STROKE_ICONS: Record<Exclude<UiIconName, "star" | "folder" | "quote">, ReactNode> = {
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 10 5-10 5L2 7z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
  type: (
    <text x="12" y="16.6" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="currentColor" stroke="none">
      Aa
    </text>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
    </>
  ),
  camera: (
    <>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
      <circle cx="12" cy="13" r="3" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  sparkle: <path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z" />,
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  "arrow-up-right": (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  eye: (
    <>
      <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.64 0 8.58 3.01 9.94 7.2a1 1 0 0 1 0 .6 10.8 10.8 0 0 1-1.6 3.05" />
      <path d="M14.08 14.16a3 3 0 0 1-4.24-4.24" />
      <path d="M17.48 17.5A10.75 10.75 0 0 1 2.06 12.35a1 1 0 0 1 0-.7 10.7 10.7 0 0 1 4.45-5.14" />
      <path d="m2 2 20 20" />
    </>
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
};

const FILL_ICONS: Record<"star" | "folder" | "quote", ReactNode> = {
  star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />,
  folder: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  quote: (
    <>
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 0-1 1.03V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
    </>
  ),
};

/**
 * Icône d'interface (compétences, chiffres clés, actions).
 * @param props.name Nom de l'icône.
 * @param props.className Classe CSS (taille et couleur via currentColor).
 */
export function UiIcon({ name, className }: IconProps & { name: UiIconName }) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true, focusable: false, className } as const;
  if (name === "star" || name === "folder" || name === "quote") {
    return (
      <svg {...common} fill="currentColor">
        {FILL_ICONS[name]}
      </svg>
    );
  }
  return (
    <svg {...common} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {STROKE_ICONS[name]}
    </svg>
  );
}

/**
 * Logo d'un réseau social ; icône « lien » pour un site web ou un réseau sans logo connu.
 * @param props.platform Identifiant du réseau (catalogue lib/social).
 * @param props.className Classe CSS.
 */
export function SocialIcon({ platform, className }: IconProps & { platform: string }) {
  const path = SOCIAL_ICON_PATHS[platform];
  if (!path) return <UiIcon name="link" className={className} />;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path fill="currentColor" d={path} />
    </svg>
  );
}
