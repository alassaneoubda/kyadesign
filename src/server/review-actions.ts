"use server";

/**
 * Avis laissés par les visiteurs depuis le site public (section « Nos témoignages clients »).
 * Action publique par nature (pas de compte visiteur) : l'avis est enregistré MASQUÉ et n'apparaît
 * sur le site qu'après validation par l'administrateur (bouton « œil » du back-office).
 * Protections : champ piège, délai minimal de saisie, liens refusés, doublons ignorés,
 * plafond horaire global, plafond d'avis en attente, un avis par navigateur et par jour.
 * Aucune donnée de contact ni adresse IP n'est stockée.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { logError, logInfo } from "@/lib/log";
import { prisma } from "@/lib/prisma";
import { containsLink, isLikelySpamSubmission, MAX_PENDING_REVIEWS, MAX_REVIEWS_PER_HOUR } from "@/lib/reviews";
import { visitorReviewSchema } from "@/lib/validators";

export type ReviewState = { ok: boolean; error: string; at: number } | null;

const REVIEW_COOKIE = "kya_review";
const HOUR_MS = 60 * 60 * 1_000;

function fail(error: string): ReviewState {
  return { ok: false, error, at: Date.now() };
}

function success(): ReviewState {
  return { ok: true, error: "", at: Date.now() };
}

/** Vrai si l'afflux d'avis dépasse les plafonds (attaque ou robot non détecté). */
async function isOverCapacity(now: number): Promise<boolean> {
  const [lastHour, pending] = await Promise.all([
    prisma.testimonial.count({ where: { source: "visitor", createdAt: { gte: new Date(now - HOUR_MS) } } }),
    prisma.testimonial.count({ where: { source: "visitor", visible: false } }),
  ]);
  return lastHour >= MAX_REVIEWS_PER_HOUR || pending >= MAX_PENDING_REVIEWS;
}

/**
 * Reçoit l'avis d'un visiteur et le met en attente de validation.
 * Un robot détecté reçoit une réponse « succès » sans que rien ne soit enregistré.
 * @param _state État précédent (useActionState).
 * @param formData name, role, company, quote, consent, openedAt, website (champ piège).
 * @returns Succès, ou message d'erreur lisible par le visiteur.
 */
export async function submitReviewAction(_state: ReviewState, formData: FormData): Promise<ReviewState> {
  const now = Date.now();
  const honeypot = String(formData.get("website") ?? "");
  if (isLikelySpamSubmission(honeypot, Number(formData.get("openedAt")), now)) return success();
  if (formData.get("consent") !== "on") return fail("Merci d'accepter la publication de votre avis.");

  const parsed = visitorReviewSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role"),
    company: formData.get("company"),
    quote: formData.get("quote"),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Vérifiez les champs obligatoires.");
  const review = parsed.data;
  if ([review.name, review.role, review.company, review.quote].some(containsLink)) {
    return fail("Les liens ne sont pas acceptés dans un avis.");
  }

  const store = await cookies();
  if (store.get(REVIEW_COOKIE)?.value) return fail("Merci, votre avis a déjà bien été envoyé aujourd'hui.");

  try {
    if (await isOverCapacity(now)) return fail("Beaucoup d'avis reçus en ce moment : réessayez un peu plus tard.");
    const duplicate = await prisma.testimonial.findFirst({ where: { quote: review.quote }, select: { id: true } });
    if (!duplicate) {
      const created = await prisma.testimonial.create({ data: { ...review, visible: false, source: "visitor" } });
      logInfo("review.received", { id: created.id });
    }
  } catch (error) {
    logError("review.submit", error);
    return fail("Envoi impossible pour le moment. Réessayez dans un instant.");
  }

  store.set(REVIEW_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  revalidatePath("/admin");
  revalidatePath("/admin/temoignages");
  return success();
}
