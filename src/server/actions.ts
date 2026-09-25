"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { cookieNames, credentialsMatch, getAdminSession, signAdminToken, signGuestToken } from "@/lib/auth";
import { createAccessCode, isAccessCode, normalizeCode } from "@/lib/codes";
import { logInfo } from "@/lib/log";
import { savePublicImage } from "@/lib/storage";
import { sendContactMail } from "@/lib/mail";
import {
  albumSchema,
  checked,
  contactSchema,
  formationSchema,
  packSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  topicsToJson,
} from "@/lib/validators";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};

async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
}

function fail(message: string): { error: string } {
  return { error: message };
}

export async function loginAction(_state: { error: string } | null, formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await credentialsMatch(email, password);
  if (!ok) return fail("Identifiants incorrects.");
  const token = await signAdminToken(email.trim().toLowerCase());
  const store = await cookies();
  store.set(cookieNames.admin, token, cookieOptions);
  logInfo("admin.login");
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  store.delete(cookieNames.admin);
  redirect("/admin/login");
}

export async function unlockAlbumAction(
  _state: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  const album = await prisma.album.findFirst({
    where: { accessCode: code, published: true },
    select: { id: true },
  });
  if (!album) return fail("Code invalide. Vérifie avec Yohann.");
  const token = await signGuestToken(code);
  const store = await cookies();
  store.set(cookieNames.guest, token, cookieOptions);
  logInfo("album.unlock", { albumId: album.id });
  redirect("/galerie");
}

export async function lockAlbumAction(): Promise<void> {
  const store = await cookies();
  store.delete(cookieNames.guest);
  redirect("/galerie");
}

export async function saveFormationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = formationSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    topics: formData.get("topics"),
    sortOrder: formData.get("sortOrder") || 0,
    published: checked(formData, "published"),
  });
  if (!parsed.success) redirect("/admin/formations?erreur=1");
  const imageFile = formData.get("image");
  const image = imageFile instanceof File ? await savePublicImage(imageFile, "formations", { compress: true }) : null;
  const id = String(formData.get("id") ?? "");
  const data = { ...parsed.data, topics: topicsToJson(parsed.data.topics) };
  if (!id && !image) redirect("/admin/formations?erreur=1");
  if (id) {
    await prisma.formation.update({
      where: { id },
      data: { ...data, ...(image ? { image } : {}) },
    });
  } else {
    await prisma.formation.create({
      data: { ...data, image: image as string },
    });
  }
  logInfo("formation.save", { id: id || "new" });
  revalidatePath("/");
  redirect("/admin/formations");
}

export async function deleteFormationAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.formation.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/formations");
}

export async function savePackAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = packSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    topics: formData.get("topics"),
    sortOrder: formData.get("sortOrder") || 0,
    highlighted: checked(formData, "highlighted"),
    published: checked(formData, "published"),
  });
  if (!parsed.success) redirect("/admin/packs?erreur=1");
  const id = String(formData.get("id") ?? "");
  const imageFile = formData.get("image");
  const image = imageFile instanceof File ? await savePublicImage(imageFile, "packs", { compress: true }) : null;
  if (!id && !image) redirect("/admin/packs?erreur=1");
  const data = { ...parsed.data, topics: topicsToJson(parsed.data.topics) };
  if (id) {
    await prisma.pack.update({
      where: { id },
      data: { ...data, ...(image ? { image } : {}) },
    });
  } else {
    await prisma.pack.create({ data: { ...data, image: image as string } });
  }
  revalidatePath("/");
  redirect("/admin/packs");
}

export async function deletePackAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.pack.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/packs");
}

export async function saveModeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const title = String(formData.get("title") ?? "").trim();
  const lead = String(formData.get("lead") ?? "").trim();
  const detail = String(formData.get("detail") ?? "").trim();
  const includes = topicsToJson(String(formData.get("includes") ?? ""));
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const imageFile = formData.get("image");
  const image = imageFile instanceof File ? await savePublicImage(imageFile, "modes", { compress: true }) : null;
  if (!id || title.length < 2 || lead.length < 2 || detail.length < 4) {
    redirect("/admin/modes?erreur=1");
  }
  const existing = await prisma.trainingMode.findUnique({ where: { id } });
  if (!existing && !image) redirect("/admin/modes?erreur=1");
  if (existing) {
    await prisma.trainingMode.update({
      where: { id },
      data: { title, lead, detail, includes, sortOrder, ...(image ? { image } : {}) },
    });
  } else {
    await prisma.trainingMode.create({
      data: { id, title, lead, detail, includes, sortOrder, image: image as string },
    });
  }
  revalidatePath("/");
  redirect("/admin/modes");
}

export async function deleteModeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.trainingMode.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/modes");
}

export async function markDemandesReadAction(): Promise<void> {
  await requireAdmin();
  await prisma.contactRequest.updateMany({ where: { read: false }, data: { read: true } });
  revalidatePath("/admin/demandes");
}

export async function saveAlbumAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const rawCode = normalizeCode(String(formData.get("accessCode") ?? "")) || createAccessCode();
  const parsed = albumSchema.safeParse({
    title: formData.get("title"),
    persons: formData.get("persons") ?? "",
    eventDate: formData.get("eventDate") ?? "",
    eventType: formData.get("eventType") || "Cérémonie",
    place: formData.get("place") ?? "",
    description: formData.get("description") ?? "",
    accessCode: rawCode,
    maxPhotos: formData.get("maxPhotos") || 200,
    published: checked(formData, "published"),
    kind: formData.get("kind") === "case" ? "case" : "gallery",
    probleme: formData.get("probleme") ?? "",
    concept: formData.get("concept") ?? "",
    creation: formData.get("creation") ?? "",
    resultat: formData.get("resultat") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success || !isAccessCode(parsed.data.accessCode) && !/^[A-Z0-9-]{4,32}$/.test(parsed.data.accessCode)) {
    redirect("/admin/albums?erreur=1");
  }
  const id = String(formData.get("id") ?? "");
  const data = { ...parsed.data, accessCode: normalizeCode(parsed.data.accessCode) };
  if (id) {
    await prisma.album.update({ where: { id }, data });
    logInfo("album.update", { albumId: id });
    revalidatePath("/galerie");
    redirect(`/admin/albums/${id}`);
  }
  const created = await prisma.album.create({ data });
  logInfo("album.create", { albumId: created.id });
  revalidatePath("/galerie");
  redirect(`/admin/albums/${created.id}`);
}

export async function deleteAlbumAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.album.delete({ where: { id } });
  logInfo("album.delete", { albumId: id });
  revalidatePath("/galerie");
  redirect("/admin/albums");
}

export async function deletePhotoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const albumId = String(formData.get("albumId") ?? "");
  const photo = await prisma.albumPhoto.findUnique({ where: { id } });
  if (!photo) redirect(`/admin/albums/${albumId}`);
  const { deletePhotoFiles } = await import("@/lib/storage");
  await deletePhotoFiles(photo.albumId, photo.id, photo.ext);
  await prisma.albumPhoto.delete({ where: { id } });
  revalidatePath("/galerie");
  redirect(`/admin/albums/${photo.albumId}`);
}

export async function saveProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = projectSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    year: formData.get("year"),
    clientName: formData.get("clientName"),
    role: formData.get("role"),
    featured: checked(formData, "featured"),
    tags: formData.get("tags") ?? "",
    probleme: formData.get("probleme"),
    concept: formData.get("concept"),
    creation: formData.get("creation"),
    resultat: formData.get("resultat"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect("/admin/projets?erreur=1");
  const tags = JSON.stringify(
    parsed.data.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );
  const coverFile = formData.get("cover");
  const cover = coverFile instanceof File ? await savePublicImage(coverFile, "creations", { compress: true }) : null;
  const existing = await prisma.project.findUnique({ where: { id: parsed.data.id } });
  const payload = { ...parsed.data, tags, ...(cover ? { cover } : {}) };
  if (existing) {
    await prisma.project.update({ where: { id: parsed.data.id }, data: payload });
  } else if (!cover) {
    redirect("/admin/projets?erreur=cover");
  } else {
    await prisma.project.create({ data: { ...payload, cover } });
  }
  const gallery = formData.getAll("gallery").filter((item): item is File => item instanceof File && item.size > 0);
  const start = await prisma.projectImage.count({ where: { projectId: parsed.data.id } });
  for (const [index, file] of gallery.entries()) {
    const src = await savePublicImage(file, "creations", { compress: true });
    if (!src) continue;
    await prisma.projectImage.create({
      data: { projectId: parsed.data.id, src, sortOrder: start + index },
    });
  }
  logInfo("project.save", { projectId: parsed.data.id });
  revalidatePath("/");
  redirect("/admin/projets");
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.project.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/projets");
}

export async function saveServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = serviceSchema.safeParse({
    number: formData.get("number"),
    title: formData.get("title"),
    text: formData.get("text"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect("/admin/services?erreur=1");
  const id = String(formData.get("id") ?? "");
  const imageFile = formData.get("image");
  const image = imageFile instanceof File ? await savePublicImage(imageFile, "services", { compress: true }) : null;
  if (!id && !image) redirect("/admin/services?erreur=1");
  if (id) {
    await prisma.service.update({ where: { id }, data: { ...parsed.data, ...(image ? { image } : {}) } });
  } else {
    await prisma.service.create({ data: { ...parsed.data, image: image as string } });
  }
  revalidatePath("/");
  redirect("/admin/services");
}

export async function deleteServiceAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.service.delete({ where: { id } });
  revalidatePath("/");
  redirect("/admin/services");
}

export async function deleteProjectImageAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const projectId = String(formData.get("projectId") ?? "");
  if (id) await prisma.projectImage.delete({ where: { id } });
  revalidatePath("/");
  redirect(projectId ? `/admin/projets?edit=${projectId}` : "/admin/projets");
}

/**
 * Enregistre la demande du formulaire, puis l'envoie par e-mail.
 * Le visiteur voit une confirmation dès que la demande est stockée.
 */
export async function submitContactAction(
  _state: { ok: boolean; error: string } | null,
  formData: FormData
): Promise<{ ok: boolean; error: string }> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: String(formData.get("tel") ?? ""),
    projectType: String(formData.get("type") ?? ""),
    budget: String(formData.get("budget") ?? ""),
    delay: String(formData.get("delai") ?? ""),
    message: formData.get("message"),
  });
  if (!parsed.success || formData.get("rgpd") !== "on") {
    return { ok: false, error: "Vérifie les champs obligatoires." };
  }

  const saved = await prisma.contactRequest.create({ data: parsed.data });
  const emailSent = await sendContactMail(saved);
  if (emailSent) {
    await prisma.contactRequest.update({ where: { id: saved.id }, data: { emailSent: true } });
  }
  logInfo("contact.received", { requestId: saved.id });
  revalidatePath("/admin/demandes");
  return { ok: true, error: "" };
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse({
    aboutName: formData.get("aboutName"),
    aboutRole: formData.get("aboutRole"),
    footerLine: formData.get("footerLine"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    whatsappDisplay: formData.get("whatsappDisplay"),
    email: formData.get("email"),
    instagram: formData.get("instagram"),
    instagramHandle: formData.get("instagramHandle"),
    tiktok: formData.get("tiktok"),
    tiktokHandle: formData.get("tiktokHandle"),
    behance: formData.get("behance"),
    behanceHandle: formData.get("behanceHandle"),
    aboutIntro: formData.get("aboutIntro"),
    aboutApproach: formData.get("aboutApproach"),
    aboutExperience: formData.get("aboutExperience"),
    contactLocation: formData.get("contactLocation"),
  });
  if (!parsed.success) redirect("/admin/reglages?erreur=1");
  await prisma.siteSetting.update({ where: { id: 1 }, data: parsed.data });
  revalidatePath("/");
  redirect("/admin/reglages?ok=1");
}
