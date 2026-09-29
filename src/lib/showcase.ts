/**
 * Règles d'affichage de la vitrine (réalisations, « À propos », témoignages).
 * Fonctions pures : n'affichent que ce qui est réellement renseigné.
 * Auteur : Kya Design — 2026-09-29 — v1
 */

export type StudyStep = { title: string; text: string };

type ProjectStory = { probleme: string; concept: string; creation: string; resultat: string };

/**
 * Identifiant d'URL lisible à partir d'un texte libre (accents retirés, minuscules, tirets).
 * @param text Titre ou identifiant saisi.
 * @param maxLength Longueur maximale du résultat.
 * @returns Slug, éventuellement vide si le texte ne contient aucun caractère exploitable.
 */
export function slugify(text: string, maxLength = 60): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/**
 * Assemble les morceaux renseignés avec un séparateur (ignore vides, espaces, null).
 * @param parts Morceaux éventuellement absents.
 * @param separator Séparateur visuel.
 * @returns Texte assemblé, ou chaîne vide si rien n'est renseigné.
 */
export function joinDefined(parts: Array<string | null | undefined>, separator = " · "): string {
  return parts
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(separator);
}

/**
 * Étapes de l'étude de cas réellement rédigées, dans l'ordre de lecture.
 * @param project Textes de la réalisation.
 * @returns Étapes non vides uniquement.
 */
export function projectSteps(project: ProjectStory): StudyStep[] {
  const steps: StudyStep[] = [
    { title: "Problème", text: project.probleme },
    { title: "Concept", text: project.concept },
    { title: "Création", text: project.creation },
    { title: "Résultat", text: project.resultat },
  ];
  return steps
    .map((step) => ({ ...step, text: step.text.trim() }))
    .filter((step) => step.text.length > 0);
}

/**
 * Médias de l'étude de cas : image principale (couverture, sinon 1re image de galerie)
 * et galerie sans doublon de l'image principale.
 * @param project Couverture et galerie.
 * @returns hero vide si aucune image n'existe ; galerie éventuellement vide.
 */
export function studyMedia(project: { cover: string; gallery: string[] }): { hero: string; gallery: string[] } {
  const gallery = [...new Set(project.gallery.map((src) => src.trim()).filter(Boolean))];
  const hero = project.cover.trim() || gallery[0] || "";
  return { hero, gallery: gallery.filter((src) => src !== hero) };
}

/**
 * Sépare le nom affiché en deux tons (maquette : prénom noir, suite jaune).
 * @param name Nom complet, ex. « Yohann Armel ».
 * @returns Premier mot et reste (reste vide si un seul mot).
 */
export function splitDisplayName(name: string): { first: string; rest: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return { first: words[0] ?? "", rest: words.slice(1).join(" ") };
}

/**
 * Lignes du badge de rôle : partie avant « — », coupée avant « & ».
 * Ex. « Graphiste & Directeur Créatif — KYA Design » → ["Graphiste", "& Directeur Créatif"].
 * @param role Rôle saisi dans les réglages.
 * @returns Une ou deux lignes, ou liste vide si rien n'est renseigné.
 */
export function roleBadgeLines(role: string): string[] {
  const main = role.split(/\s+[—–-]\s+/)[0]?.trim() ?? "";
  if (!main) return [];
  const ampersand = main.indexOf(" & ");
  if (ampersand <= 0) return [main];
  return [main.slice(0, ampersand).trim(), main.slice(ampersand + 1).trim()];
}

export type SkillIcon = "pen" | "layers" | "type" | "layout" | "camera" | "play" | "target" | "sparkle";
export type FactIcon = "star" | "folder" | "users";

const SKILL_ICON_RULES: Array<[RegExp, SkillIcon]> = [
  [/direction artistique|illustration|dessin/i, "pen"],
  [/identit|logo|branding|marque/i, "layers"],
  [/typo/i, "type"],
  [/mise en page|print|édition|edition|layout/i, "layout"],
  [/photo/i, "camera"],
  [/motion|vid[ée]o|anim/i, "play"],
  [/strat|marketing|communication/i, "target"],
];

/**
 * Pictogramme d'une compétence selon son libellé (maquette « À propos »).
 * @param label Libellé saisi dans le back-office.
 * @returns Clé d'icône ; « sparkle » si aucun mot-clé ne correspond.
 */
export function skillIconFor(label: string): SkillIcon {
  return SKILL_ICON_RULES.find(([pattern]) => pattern.test(label))?.[1] ?? "sparkle";
}

/**
 * Pictogramme d'un chiffre clé : par mot-clé, sinon selon sa position (étoile, dossier, personnes).
 * @param label Libellé du chiffre clé.
 * @param index Position dans la liste.
 * @returns Clé d'icône.
 */
export function factIconFor(label: string, index: number): FactIcon {
  if (/expert|domaine|ann[ée]e/i.test(label)) return "star";
  if (/projet|r[ée]alisation/i.test(label)) return "folder";
  if (/client|mesure|satisf/i.test(label)) return "users";
  const cycle: FactIcon[] = ["star", "folder", "users"];
  return cycle[index % cycle.length];
}

/**
 * Initiales d'un client pour l'avatar de secours (2 lettres maximum).
 * @param name Nom du client.
 * @returns Initiales en majuscules, ou chaîne vide.
 */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
