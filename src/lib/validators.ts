import { z } from "zod";

const topics = z.string().trim().min(1, "Indique au moins un élément enseigné.");

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

export const projectSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9-]+$/, "Identifiant en minuscules, sans espace."),
  title: z.string().trim().min(2).max(120),
  categoryId: z.string().trim().min(2),
  year: z.string().trim().min(4).max(4),
  clientName: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
  featured: z.boolean(),
  tags: z.string().trim().max(200),
  probleme: z.string().trim().min(2).max(800),
  concept: z.string().trim().min(2).max(800),
  creation: z.string().trim().min(2).max(800),
  resultat: z.string().trim().min(2).max(800),
  sortOrder: z.coerce.number().int().min(0).max(999),
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
  instagram: z.string().trim().url(),
  instagramHandle: z.string().trim().min(1).max(80),
  tiktok: z.string().trim().url(),
  tiktokHandle: z.string().trim().min(1).max(80),
  behance: z.string().trim().url(),
  behanceHandle: z.string().trim().min(1).max(80),
  linkedin: z.union([z.literal(""), z.string().trim().url()]),
  linkedinHandle: z.string().trim().max(80),
  aboutIntro: z.string().trim().min(10).max(800),
  aboutApproach: z.string().trim().min(10).max(800),
  aboutExperience: z.string().trim().min(10).max(800),
  contactLocation: z.string().trim().min(2).max(80),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().max(40),
  projectType: z.string().trim().max(80),
  budget: z.string().trim().max(40),
  delay: z.string().trim().max(80),
  message: z.string().trim().min(5).max(4000),
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
