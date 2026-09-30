"use server";

import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminCredentials, saveAdminCredentials } from "@/lib/admin-account";
import { requireAdmin } from "@/lib/admin-guard";
import {
  cookieNames,
  signAdminToken,
  signGuestToken,
  verifyAdminCredentials,
} from "@/lib/auth";
import { createAccessCode, isAccessCode, normalizeCode } from "@/lib/codes";
import { logError, logInfo } from "@/lib/log";
import { slugify } from "@/lib/showcase";
import {
  ImageValidationError,
  imageHasTransparency,
  savePublicImage,
  saveSoftwareIcon,
  saveCvPdf,
} from "@/lib/storage";
import { sendContactMail } from "@/lib/mail";
import { checkSubmission, submissionErrorMessage } from "@/lib/upload-limits";
import { readUploadReceipts } from "@/lib/upload-receipt";
import {
  adminAccountSchema,
  albumSchema,
  categorySchema,
  checked,
  contactSchema,
  formationSchema,
  packSchema,
  projectSchema,
  serviceSchema,
  settingsSchema,
  softwareSchema,
  topicsToJson,
} from "@/lib/validators";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
};

function fail(message: string): { error: string } {
  return { error: message };
}

export async function loginAction(_state: { error: string } | null, formData: FormData): Promise<{ error: string }> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  let credentials;
  try {
    credentials = await verifyAdminCredentials(email, password);
  } catch (error) {
    logError("admin.login", error);
    return fail("Connexion impossible pour le moment. Réessaie dans un instant.");
  }
  if (!credentials) return fail("Identifiants incorrects.");
  const token = await signAdminToken(credentials);
  const store = await cookies();
  store.set(cookieNames.admin, token, cookieOptions);
  logInfo("admin.login", { source: credentials.source });
  redirect("/admin");
}

type AccountState = { ok: boolean; error: string } | null;

/**
 * Change l'e-mail et/ou le mot de passe de connexion au back-office.
 * Exige le mot de passe actuel, hache le nouveau avec bcrypt (coût 12) et ré-émet la session :
 * les autres appareils connectés sont déconnectés.
 * @param _state État précédent du formulaire.
 * @param formData currentPassword, email, newPassword, confirmPassword.
 * @returns ok, ou le message d'erreur à afficher.
 */
export async function updateAdminAccountAction(_state: AccountState, formData: FormData): Promise<AccountState> {
  await requireAdmin();
  const parsed = adminAccountSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    email: String(formData.get("email") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." };
  }
  const { currentPassword, email, newPassword } = parsed.data;

  try {
    const current = await getAdminCredentials();
    if (!current || !(await compare(currentPassword, current.passwordHash))) {
      logInfo("admin.credentials_update_denied");
      return { ok: false, error: "Mot de passe actuel incorrect." };
    }
    if (email === current.email && !newPassword) {
      return { ok: false, error: "Aucune modification à enregistrer." };
    }
    const passwordHash = newPassword ? await hash(newPassword, 12) : current.passwordHash;
    const version = await saveAdminCredentials(current, { email, passwordHash });
    if (version === null) {
      return { ok: false, error: "Les accès ont été modifiés entre-temps. Recharge la page et recommence." };
    }
    const store = await cookies();
    store.set(cookieNames.admin, await signAdminToken({ email, version }), cookieOptions);
    logInfo("admin.credentials_updated", {
      emailChanged: String(email !== current.email),
      passwordChanged: String(Boolean(newPassword)),
    });
  } catch (error) {
    logError("admin.credentials_update", error);
    return { ok: false, error: "Enregistrement impossible pour le moment. Réessaie dans un instant." };
  }
  revalidatePath("/admin/compte");
  return { ok: true, error: "" };
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
  const { deleteAlbumFiles } = await import("@/lib/storage");
  await deleteAlbumFiles(id);
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

// ─── Réalisations ─────────────────────────────────────────────────────────────

/**
 * Identifiant libre dérivé du texte (slug), suffixé -2, -3… si déjà pris.
 * Une création ne peut jamais écraser une réalisation existante.
 */
async function uniqueProjectId(base: string): Promise<string> {
  const root = slugify(base) || "realisation";
  const rows = await prisma.project.findMany({
    where: { id: { startsWith: root } },
    select: { id: true },
    take: 1000,
  });
  const taken = new Set(rows.map((row) => row.id));
  if (!taken.has(root)) return root;
  let suffix = 2;
  while (taken.has(`${root}-${suffix}`)) suffix += 1;
  return `${root}-${suffix}`;
}

/** Catégorie conservée seulement si elle existe (hors « Tous ») ; sinon « sans catégorie ». */
async function resolveCategoryId(categoryId: string): Promise<string> {
  if (!categoryId || categoryId === "all") return "";
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  return category?.id ?? "";
}

function tagsToJson(raw: string): string {
  return JSON.stringify(
    raw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );
}

/** Résultat du formulaire réalisation : erreur à afficher, ou identifiant de la réalisation enregistrée. */
export type ProjectFormState = { error: string } | { ok: true; projectId: string } | null;

type ProjectImages = { cover: string | null; gallery: string[] };

const PROJECT_ERRORS = {
  format: "Un champ dépasse la longueur autorisée. Raccourcis-le puis réessaie.",
  introuvable: "Cette réalisation n'existe plus : recharge la page.",
  receipts: "L'envoi des images a expiré ou est invalide : recharge la page puis ajoute-les à nouveau.",
  duplicate: "La même image a été envoyée deux fois : retire le doublon puis réessaie.",
  storage: "Une image n'a pas pu être enregistrée sur le stockage en ligne. Réessaie dans un instant.",
  save: "Enregistrement impossible pour le moment (base de données injoignable). Réessaie dans un instant.",
} as const;

const IMAGE_ERRORS: Record<ImageValidationError["code"], string> = {
  format: "Format d'image refusé. Utilise une image JPG, PNG, WebP ou TIFF (les photos HEIC d'iPhone doivent être exportées en JPG).",
  size: "Image trop lourde (25 Mo maximum par image).",
  unreadable: "Une image est illisible (fichier abîmé ou format non pris en charge). Réenregistre-la en JPG.",
};

/**
 * Images déjà envoyées une par une par le navigateur : reçus vérifiés (signature, fraîcheur),
 * puis plafonds de la soumission (100 images, 25 Mo) recontrôlés côté serveur.
 * @returns null si le formulaire ne contient pas de reçus (envoi classique sans JavaScript).
 */
function imagesFromReceipts(raw: FormDataEntryValue | null): ProjectImages | { error: string } | null {
  if (typeof raw !== "string" || raw === "") return null;
  const batch = readUploadReceipts(raw);
  if (batch.ok) return { cover: batch.cover, gallery: batch.gallery };
  if (batch.code === "limits") return fail(submissionErrorMessage(batch.check));
  return fail(batch.code === "duplicate" ? PROJECT_ERRORS.duplicate : PROJECT_ERRORS.receipts);
}

/** Envoi classique (sans JavaScript) : mêmes plafonds, images stockées avant toute écriture en base. */
async function imagesFromFiles(formData: FormData): Promise<ProjectImages | { error: string }> {
  const coverEntry = formData.get("cover");
  const coverFile = coverEntry instanceof File && coverEntry.size > 0 ? coverEntry : null;
  const files = formData.getAll("gallery").filter((item): item is File => item instanceof File && item.size > 0);
  const check = checkSubmission([...(coverFile ? [coverFile] : []), ...files].map((file) => file.size));
  if (!check.ok) return fail(submissionErrorMessage(check));
  try {
    const cover = coverFile ? await savePublicImage(coverFile, "creations", { compress: true }) : null;
    const gallery: string[] = [];
    for (const file of files) {
      const src = await savePublicImage(file, "creations", { compress: true });
      if (src) gallery.push(src);
    }
    return { cover, gallery };
  } catch (error) {
    if (error instanceof ImageValidationError) return fail(IMAGE_ERRORS[error.code]);
    logError("project.upload", error);
    return fail(PROJECT_ERRORS.storage);
  }
}

/** Écrit la réalisation et sa galerie en une seule transaction (aucun appel externe à l'intérieur). */
async function persistProject(
  existingId: string,
  fields: z.infer<typeof projectSchema>,
  images: ProjectImages,
  removeCover: boolean
): Promise<{ error: string } | { projectId: string }> {
  const { id: requestedId, ...rest } = fields;
  const data = { ...rest, categoryId: await resolveCategoryId(rest.categoryId), tags: tagsToJson(rest.tags) };
  try {
    const projectId = existingId || (await uniqueProjectId(requestedId || rest.title));
    const start = existingId ? await prisma.projectImage.count({ where: { projectId } }) : 0;
    const coverUpdate = images.cover ? { cover: images.cover } : removeCover ? { cover: "" } : {};
    const gallery = images.gallery.map((src, index) => ({ projectId, src, sortOrder: start + index }));
    await prisma.$transaction([
      existingId
        ? prisma.project.update({ where: { id: projectId }, data: { ...data, ...coverUpdate } })
        : prisma.project.create({ data: { ...data, id: projectId, cover: images.cover ?? "" } }),
      ...(gallery.length ? [prisma.projectImage.createMany({ data: gallery })] : []),
    ]);
    return { projectId };
  } catch (error) {
    logError("project.save", error);
    return fail(PROJECT_ERRORS.save);
  }
}

/**
 * Crée ou met à jour une réalisation. Tous les champs sont facultatifs :
 * un champ vide est enregistré vide et simplement masqué sur le site.
 * Les erreurs sont renvoyées au formulaire (saisie conservée, pas de rechargement de page).
 * @param _state État précédent du formulaire.
 * @param formData Champs du formulaire + reçus des images (« uploads ») ; existingId en modification.
 * @returns Message d'erreur à afficher, ou identifiant de la réalisation enregistrée.
 */
export async function saveProjectAction(_state: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  await requireAdmin();
  const parsed = projectSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
    year: formData.get("year"),
    clientName: formData.get("clientName"),
    role: formData.get("role"),
    featured: checked(formData, "featured"),
    visible: checked(formData, "visible"),
    tags: formData.get("tags"),
    probleme: formData.get("probleme"),
    concept: formData.get("concept"),
    creation: formData.get("creation"),
    resultat: formData.get("resultat"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return fail(PROJECT_ERRORS.format);
  const existingId = String(formData.get("existingId") ?? "").trim();
  if (existingId) {
    const exists = await prisma.project.findUnique({ where: { id: existingId }, select: { id: true } }).catch(() => null);
    if (!exists) return fail(PROJECT_ERRORS.introuvable);
  }

  const images = imagesFromReceipts(formData.get("uploads")) ?? (await imagesFromFiles(formData));
  if ("error" in images) return images;
  const saved = await persistProject(existingId, parsed.data, images, checked(formData, "removeCover"));
  if ("error" in saved) return saved;

  logInfo(existingId ? "project.update" : "project.create", {
    projectId: saved.projectId,
    visible: String(parsed.data.visible),
    images: String(images.gallery.length + (images.cover ? 1 : 0)),
  });
  revalidatePath("/");
  revalidatePath("/admin/projets");
  return { ok: true, projectId: saved.projectId };
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await prisma.project.deleteMany({ where: { id } });
    logInfo("project.delete", { projectId: id });
  }
  revalidatePath("/");
  revalidatePath("/admin/projets");
  redirect("/admin/projets?ok=supprime");
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

/**
 * Crée ou met à jour un logiciel (nom, jauge %, icône).
 * @param formData Formulaire back-office.
 */
export async function saveSoftwareAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = softwareSchema.safeParse({
    name: formData.get("name"),
    level: formData.get("level"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect("/admin/logiciels?erreur=1");
  const id = String(formData.get("id") ?? "");
  const iconFile = formData.get("icon");
  let icon: string | null = null;
  try {
    icon = iconFile instanceof File ? await saveSoftwareIcon(iconFile) : null;
  } catch {
    redirect("/admin/logiciels?erreur=1");
  }
  if (!id && !icon) redirect("/admin/logiciels?erreur=1");
  if (id) {
    await prisma.software.update({
      where: { id },
      data: { ...parsed.data, ...(icon ? { icon } : {}) },
    });
  } else {
    await prisma.software.create({
      data: { ...parsed.data, icon: icon as string },
    });
  }
  logInfo("software.save", { name: parsed.data.name });
  revalidatePath("/");
  redirect("/admin/logiciels");
}

/**
 * Supprime un logiciel de la section outils.
 * @param formData Contient l'id.
 */
export async function deleteSoftwareAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.software.delete({ where: { id } });
  logInfo("software.delete", { id });
  revalidatePath("/");
  redirect("/admin/logiciels");
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
 * L'e-mail du visiteur est facultatif ; s'il est saisi, son format est vérifié.
 * Le visiteur voit une confirmation dès que la demande est stockée.
 */
export async function submitContactAction(
  _state: { ok: boolean; error: string } | null,
  formData: FormData
): Promise<{ ok: boolean; error: string }> {
  if (formData.get("rgpd") !== "on") {
    return { ok: false, error: "Merci d'accepter la politique de confidentialité." };
  }
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("tel"),
    projectType: formData.get("type"),
    budget: formData.get("budget"),
    delay: formData.get("delai"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    const emailIssue = parsed.error.issues.some((issue) => issue.path[0] === "email");
    return {
      ok: false,
      error: emailIssue ? "Adresse e-mail invalide — corrige-la ou laisse le champ vide." : "Vérifie les champs obligatoires.",
    };
  }

  let saved;
  try {
    saved = await prisma.contactRequest.create({ data: parsed.data });
  } catch (error) {
    logError("contact.save", error);
    return { ok: false, error: "Enregistrement impossible pour le moment. Réessaie dans un instant." };
  }
  const emailSent = await sendContactMail(saved);
  if (emailSent) {
    await prisma.contactRequest.update({ where: { id: saved.id }, data: { emailSent: true } });
  }
  logInfo("contact.received", { requestId: saved.id, withEmail: String(Boolean(saved.email)) });
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
    aboutIntro: formData.get("aboutIntro"),
    aboutApproach: formData.get("aboutApproach"),
    aboutExperience: formData.get("aboutExperience"),
    aboutTagline: formData.get("aboutTagline"),
    contactLocation: formData.get("contactLocation"),
  });
  if (!parsed.success) redirect("/admin/reglages?erreur=1");

  const heroFile = formData.get("heroImage");
  const portraitFile = formData.get("portraitImage");
  const cvFile = formData.get("cvFile");

  let heroImage: string | null = null;
  let portraitImage: string | null = null;
  let portraitCutout = false;
  let cvFileName: string | null = null;
  try {
    heroImage =
      heroFile instanceof File && heroFile.size > 0
        ? await savePublicImage(heroFile, "brand", { compress: true })
        : null;
    if (portraitFile instanceof File && portraitFile.size > 0) {
      portraitCutout = await imageHasTransparency(portraitFile);
      portraitImage = await savePublicImage(portraitFile, "brand", { compress: true });
    }
    cvFileName = cvFile instanceof File && cvFile.size > 0 ? await saveCvPdf(cvFile) : null;
  } catch (error) {
    logError("settings.upload", error);
    redirect("/admin/reglages?erreur=1");
  }

  try {
    await prisma.siteSetting.update({
      where: { id: 1 },
      data: {
        ...parsed.data,
        ...(heroImage ? { heroImage } : {}),
        ...(portraitImage ? { portraitImage, portraitCutout } : {}),
        ...(cvFileName ? { cvFileName } : {}),
      },
    });
  } catch (error) {
    logError("settings.save", error);
    redirect("/admin/reglages?erreur=1");
  }
  logInfo("settings.save");
  revalidatePath("/");
  redirect("/admin/reglages?ok=1");
}

/**
 * Crée ou met à jour une catégorie de réalisations.
 * @param formData Formulaire back-office.
 */
export async function saveCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) redirect("/admin/categories?erreur=1");
  if (parsed.data.id === "all") redirect("/admin/categories?erreur=1");

  const existingId = String(formData.get("existingId") ?? "");
  if (existingId && existingId !== "all") {
    await prisma.category.update({
      where: { id: existingId },
      data: { label: parsed.data.label, sortOrder: parsed.data.sortOrder },
    });
  } else {
    const exists = await prisma.category.findUnique({ where: { id: parsed.data.id } });
    if (exists) redirect("/admin/categories?erreur=1");
    await prisma.category.create({ data: parsed.data });
  }
  logInfo("category.save", { id: parsed.data.id });
  revalidatePath("/");
  redirect("/admin/categories");
}

/**
 * Supprime une catégorie (sauf « Tous »). Refuse si des projets y sont liés.
 * @param formData Contient l'id.
 */
export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === "all") redirect("/admin/categories");
  const used = await prisma.project.count({ where: { categoryId: id } });
  if (used > 0) redirect("/admin/categories?erreur=liee");
  await prisma.category.delete({ where: { id } });
  logInfo("category.delete", { id });
  revalidatePath("/");
  redirect("/admin/categories");
}
