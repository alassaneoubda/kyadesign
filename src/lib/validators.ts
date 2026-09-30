import { z } from "zod";
import { isSafeExternalUrl, isSocialPlatform } from "@/lib/social";

const topics = z.string().trim().min(1, "Indique au moins un élément enseigné.");

/**
 * Texte facultatif : un champ absent (null) ou vide devient "" — jamais « null » ou « undefined » affiché.
 * @param max Longueur maximale acceptée.
 */
function optionalText(max: number) {
  return z.preprocess((value) => (value == null ? "" : value), z.string().trim().max(max));
}

/** Ordre d'affichage : vide ou absent = 0. */
const sortOrderField = z.preprocess(
  (value) => (value == null || value === "" ? 0 : value),
  z.coerce.number().int().min(0).max(999)
);

const emailFormat = z.string().email();

export const formationSchema = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(500),
  topics,
  sortOrder: z.coerce.number().int().min(0).max(999),
  published: z.boolean(),
});

export const packSchema = z.object({
  title: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(4).max(300),
  topics,
  sortOrder: z.coerce.number().int().min(0).max(999),
  highlighted: z.boolean(),
  published: z.boolean(),
});

export const albumSchema = z.object({
  title: z.string().trim().min(2).max(160),
  persons: z.string().trim().max(160),
  eventDate: z.string().trim().max(40),
  eventType: z.string().trim().min(2).max(40),
  place: z.string().trim().max(120),
  description: z.string().trim().max(800),
  accessCode: z.string().trim().min(4).max(32),
  maxPhotos: z.coerce.number().int().min(1).max(500),
  published: z.boolean(),
  kind: z.enum(["gallery", "case"]),
  probleme: z.string().trim().max(800),
  concept: z.string().trim().max(800),
  creation: z.string().trim().max(800),
  resultat: z.string().trim().max(800),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

/**
 * Réalisation : tous les champs de contenu sont facultatifs.
 * Seules les longueurs maximales et l'ordre (0 à 999) sont contrôlés ; l'identifiant saisi est converti en slug.
 */
export const projectSchema = z.object({
  /** Saisie libre : convertie en identifiant d'URL (slug) côté serveur, jamais refusée. */
  id: optionalText(60),
  title: optionalText(120),
  categoryId: optionalText(40),
  year: optionalText(10),
  clientName: optionalText(120),
  role: optionalText(160),
  featured: z.boolean(),
  visible: z.boolean(),
  tags: optionalText(200),
  probleme: optionalText(800),
  concept: optionalText(800),
  creation: optionalText(800),
  resultat: optionalText(800),
  sortOrder: sortOrderField,
});

/** Réseau social affiché dans « Suivez-nous ». */
export const socialLinkSchema = z.object({
  platform: z.string().trim().refine(isSocialPlatform, { message: "Choisis un réseau dans la liste." }),
  label: optionalText(60),
  handle: optionalText(80),
  url: z
    .string()
    .trim()
    .max(500)
    .refine(isSafeExternalUrl, { message: "Lien invalide : il doit commencer par https://" }),
  visible: z.boolean(),
  sortOrder: sortOrderField,
});

/** Témoignage client : nom et texte obligatoires, le reste facultatif. */
export const testimonialSchema = z.object({
  name: z.string().trim().min(2, "Indique le nom du client.").max(120),
  role: optionalText(120),
  company: optionalText(120),
  quote: z.string().trim().min(10, "Le témoignage doit faire au moins 10 caractères.").max(1200),
  visible: z.boolean(),
  sortOrder: sortOrderField,
});

/**
 * Avis envoyé par un visiteur depuis le site : nom et texte obligatoires, fonction et entreprise facultatives.
 * Aucune photo ni donnée de contact n'est demandée.
 */
export const visitorReviewSchema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  role: optionalText(120),
  company: optionalText(120),
  quote: z.string().trim().min(20, "Votre avis doit faire au moins 20 caractères.").max(800),
});

/** Bascule « œil » : affiche ou masque un contenu sur le site public, sans le supprimer. */
export const visibilitySchema = z.object({
  entity: z.enum(["project", "social", "testimonial"]),
  id: z.string().trim().min(1).max(80),
  visible: z.boolean(),
});

export const serviceSchema = z.object({
  number: z.string().trim().min(1).max(4),
  title: z.string().trim().min(2).max(120),
  text: z.string().trim().min(4).max(400),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const softwareSchema = z.object({
  name: z.string().trim().min(1).max(80),
  level: z.coerce.number().int().min(0).max(100),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const categorySchema = z.object({
  id: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Identifiant en minuscules, sans espace (ex: identite-visuelle)."),
  label: z.string().trim().min(2).max(80),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const settingsSchema = z.object({
  aboutName: z.string().trim().min(2).max(80),
  aboutRole: z.string().trim().min(2).max(160),
  footerLine: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(6).max(40),
  whatsapp: z.string().trim().url(),
  whatsappDisplay: z.string().trim().min(3).max(80),
  email: z.string().trim().email(),
  aboutIntro: z.string().trim().min(10).max(800),
  aboutApproach: z.string().trim().min(10).max(800),
  aboutExperience: z.string().trim().min(10).max(800),
  aboutTagline: optionalText(120),
  contactLocation: z.string().trim().min(2).max(80),
});

/**
 * Formulaire de contact public. L'e-mail est facultatif ; s'il est saisi, son format est vérifié.
 * Nom et message restent obligatoires.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: optionalText(160).refine((value) => value === "" || emailFormat.safeParse(value).success, {
    message: "Adresse e-mail invalide.",
  }),
  phone: optionalText(40),
  projectType: optionalText(80),
  budget: optionalText(40),
  delay: optionalText(80),
  message: z.string().trim().min(5).max(4000),
});

export const ADMIN_PASSWORD_MIN = 12;
// bcrypt ignore tout ce qui dépasse 72 octets : au-delà, deux mots de passe différents seraient équivalents.
const ADMIN_PASSWORD_MAX_BYTES = 72;

/**
 * Changement des accès back-office. Le mot de passe actuel est toujours exigé ;
 * un nouveau mot de passe vide signifie « garder l'actuel ».
 */
export const adminAccountSchema = z
  .object({
    currentPassword: z.string().min(1, "Saisis ton mot de passe actuel.").max(200),
    email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(160),
    newPassword: z.string().max(200),
    confirmPassword: z.string().max(200),
  })
  .superRefine((value, ctx) => {
    if (!value.newPassword) return;
    if (value.newPassword.length < ADMIN_PASSWORD_MIN) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: `Le nouveau mot de passe doit faire au moins ${ADMIN_PASSWORD_MIN} caractères.`,
      });
    }
    if (new TextEncoder().encode(value.newPassword).length > ADMIN_PASSWORD_MAX_BYTES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: "Le nouveau mot de passe est trop long (72 caractères maximum).",
      });
    }
    if (value.newPassword !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "La confirmation ne correspond pas au nouveau mot de passe.",
      });
    }
  });

export function checked(formData: FormData, name: string): boolean {
  return formData.get(name) === "on";
}

export function topicsToJson(raw: string): string {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return JSON.stringify(lines);
}

export function topicsFromJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}
