"use server";

/**
 * Server actions de la vitrine : visibilité (œil), réseaux sociaux, témoignages clients.
 * Chaque action vérifie la session administrateur côté serveur avant toute écriture.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { logError, logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { savePublicImage } from "@/lib/storage";
import { checked, socialLinkSchema, testimonialSchema, visibilitySchema } from "@/lib/validators";

// ─── Visibilité ───────────────────────────────────────────────────────────────

export type VisibilityState = { ok: boolean; visible: boolean; message: string; at: number } | null;

const ADMIN_PATHS = { project: "/admin/projets", social: "/admin/reseaux", testimonial: "/admin/temoignages" } as const;

const VISIBLE_MESSAGES = {
  project: ["Réalisation masquée du site.", "Réalisation visible sur le site."],
  social: ["Réseau masqué du site.", "Réseau visible sur le site."],
  testimonial: ["Témoignage masqué du site.", "Témoignage publié sur le site."],
} as const;

/**
 * Affiche ou masque un contenu sur le site public. Ne supprime jamais rien.
 * @param state État précédent (useActionState).
 * @param formData entity (project | social | testimonial), id, visible ("true" | "false" = état cible).
 * @returns Nouvel état persistant, ou message d'erreur.
 */
export async function toggleVisibilityAction(state: VisibilityState, formData: FormData): Promise<VisibilityState> {
  await requireAdmin();
  const parsed = visibilitySchema.safeParse({
    entity: formData.get("entity"),
    id: formData.get("id"),
    visible: formData.get("visible") === "true",
  });
  const previous = state?.visible ?? formData.get("visible") !== "true";
  if (!parsed.success) return { ok: false, visible: previous, message: "Action invalide.", at: Date.now() };

  const { entity, id, visible } = parsed.data;
  try {
    const where = { id };
    const data = { visible };
    const result =
      entity === "project"
        ? await prisma.project.updateMany({ where, data })
        : entity === "social"
          ? await prisma.socialLink.updateMany({ where, data })
          : await prisma.testimonial.updateMany({ where, data });
    if (result.count === 0) {
      return { ok: false, visible: previous, message: "Élément introuvable : recharge la page.", at: Date.now() };
    }
  } catch (error) {
    logError(`${entity}.visibility`, error);
    return { ok: false, visible: previous, message: "Enregistrement impossible, réessaie.", at: Date.now() };
  }

  logInfo(`${entity}.visibility`, { id, visible: String(visible) });
  revalidatePath("/");
  revalidatePath(ADMIN_PATHS[entity]);
  return { ok: true, visible, message: VISIBLE_MESSAGES[entity][visible ? 1 : 0], at: Date.now() };
}

// ─── Réseaux sociaux ──────────────────────────────────────────────────────────

/**
 * Crée ou met à jour un réseau social (nom, icône, lien, visibilité, ordre).
 * @param formData Formulaire back-office (id présent en modification).
 */
export async function saveSocialLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = socialLinkSchema.safeParse({
    platform: formData.get("platform"),
    label: formData.get("label"),
    handle: formData.get("handle"),
    url: formData.get("url"),
    visible: checked(formData, "visible"),
    sortOrder: formData.get("sortOrder"),
  });
  const id = String(formData.get("id") ?? "").trim();
  const back = id ? `&edit=${encodeURIComponent(id)}` : "";
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    redirect(`/admin/reseaux?erreur=${field === "url" ? "lien" : field === "platform" ? "reseau" : "1"}${back}`);
  }

  try {
    if (id) {
      await prisma.socialLink.update({ where: { id }, data: parsed.data });
    } else {
      await prisma.socialLink.create({ data: parsed.data });
    }
  } catch (error) {
    logError("social.save", error);
    redirect(`/admin/reseaux?erreur=1${back}`);
  }
  logInfo(id ? "social.update" : "social.create", { platform: parsed.data.platform });
  revalidatePath("/");
  revalidatePath("/admin/reseaux");
  redirect("/admin/reseaux?ok=enregistre");
}

/**
 * Supprime définitivement un réseau social.
 * @param formData Contient l'id.
 */
export async function deleteSocialLinkAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await prisma.socialLink.deleteMany({ where: { id } });
    logInfo("social.delete", { id });
  }
  revalidatePath("/");
  revalidatePath("/admin/reseaux");
  redirect("/admin/reseaux?ok=supprime");
}

// ─── Témoignages ──────────────────────────────────────────────────────────────

/**
 * Crée ou met à jour un témoignage client (photo facultative).
 * @param formData Formulaire back-office (id présent en modification, removePhoto pour retirer la photo).
 */
export async function saveTestimonialAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = testimonialSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    company: formData.get("company"),
    quote: formData.get("quote"),
    visible: checked(formData, "visible"),
    sortOrder: formData.get("sortOrder"),
  });
  const id = String(formData.get("id") ?? "").trim();
  const back = id ? `&edit=${encodeURIComponent(id)}` : "";
  if (!parsed.success) {
    const field = String(parsed.error.issues[0]?.path[0] ?? "");
    redirect(`/admin/temoignages?erreur=${field === "quote" ? "texte" : field === "name" ? "nom" : "1"}${back}`);
  }

  let photo: string | null = null;
  try {
    const file = formData.get("photo");
    photo = file instanceof File ? await savePublicImage(file, "temoignages", { compress: true }) : null;
  } catch (error) {
    logError("testimonial.upload", error);
    redirect(`/admin/temoignages?erreur=image${back}`);
  }

  const photoUpdate = photo ? { photo } : checked(formData, "removePhoto") ? { photo: "" } : {};
  try {
    if (id) {
      await prisma.testimonial.update({ where: { id }, data: { ...parsed.data, ...photoUpdate } });
    } else {
      await prisma.testimonial.create({ data: { ...parsed.data, photo: photo ?? "" } });
    }
  } catch (error) {
    logError("testimonial.save", error);
    redirect(`/admin/temoignages?erreur=1${back}`);
  }
  logInfo(id ? "testimonial.update" : "testimonial.create", { visible: String(parsed.data.visible) });
  revalidatePath("/");
  revalidatePath("/admin/temoignages");
  redirect("/admin/temoignages?ok=enregistre");
}

/**
 * Supprime définitivement un témoignage.
 * @param formData Contient l'id.
 */
export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await prisma.testimonial.deleteMany({ where: { id } });
    logInfo("testimonial.delete", { id });
  }
  revalidatePath("/");
  revalidatePath("/admin/temoignages");
  redirect("/admin/temoignages?ok=supprime");
}
