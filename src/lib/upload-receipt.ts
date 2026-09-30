/**
 * Reçus d'envoi d'image signés (HMAC-SHA256) : prouvent à l'enregistrement final qu'une image a bien été
 * contrôlée et stockée par le serveur, avec son poids réel. Empêche d'attacher une URL arbitraire
 * ou de contourner le plafond de 25 Mo en déclarant de faux poids.
 * Auteur : Kya Design — 2026-09-30 — v1
 */
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import {
  checkSubmission,
  MAX_IMAGE_REQUEST_BYTES,
  MAX_IMAGES_PER_SUBMISSION,
  type SubmissionCheck,
} from "@/lib/upload-limits";

/** Durée de validité d'un reçu : le formulaire doit être enregistré dans la journée. */
export const RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;

const PROJECT_IMAGE_SRC = /^\/api\/uploads\/creations\/[0-9a-f-]{36}\.webp$/;

export const uploadReceiptSchema = z.object({
  src: z.string().regex(PROJECT_IMAGE_SRC),
  bytes: z.number().int().positive().max(MAX_IMAGE_REQUEST_BYTES),
  iat: z.number().int().positive(),
  sig: z.string().regex(/^[a-f0-9]{64}$/),
});

export type UploadReceipt = z.infer<typeof uploadReceiptSchema>;

function secretFromEnv(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET manquant ou trop court.");
  return secret;
}

function signature(src: string, bytes: number, iat: number, secret: string): string {
  return createHmac("sha256", secret).update(`project-image|${src}|${bytes}|${iat}`).digest("hex");
}

/**
 * Émet le reçu d'une image stockée.
 * @param src Chemin public de l'image.
 * @param bytes Poids reçu par le serveur.
 * @param secret Clé de signature (AUTH_SECRET par défaut).
 * @param now Horodatage (injectable pour les tests).
 * @returns Reçu signé à renvoyer au navigateur.
 */
export function signUploadReceipt(src: string, bytes: number, secret = secretFromEnv(), now = Date.now()): UploadReceipt {
  return { src, bytes, iat: now, sig: signature(src, bytes, now, secret) };
}

/**
 * Vérifie un reçu (format, signature, fraîcheur).
 * @param value Reçu renvoyé par le navigateur (non fiable).
 * @param secret Clé de signature (AUTH_SECRET par défaut).
 * @param now Horodatage (injectable pour les tests).
 * @returns Le reçu validé, ou null s'il est invalide, falsifié ou expiré.
 */
export function verifyUploadReceipt(value: unknown, secret = secretFromEnv(), now = Date.now()): UploadReceipt | null {
  const parsed = uploadReceiptSchema.safeParse(value);
  if (!parsed.success) return null;
  const { src, bytes, iat, sig } = parsed.data;
  if (iat > now + 60_000 || now - iat > RECEIPT_TTL_MS) return null;
  const expected = Buffer.from(signature(src, bytes, iat, secret), "hex");
  const received = Buffer.from(sig, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received) ? parsed.data : null;
}

export type ReceiptBatch =
  | { ok: true; cover: string | null; gallery: string[] }
  | { ok: false; code: "invalid" | "duplicate" }
  | { ok: false; code: "limits"; check: Extract<SubmissionCheck, { ok: false }> };

const receiptBatchSchema = z.object({
  cover: z.unknown().nullable(),
  gallery: z.array(z.unknown()).max(MAX_IMAGES_PER_SUBMISSION),
});

/**
 * Valide l'ensemble des reçus d'une soumission : chaque reçu, l'absence de doublon,
 * puis les plafonds (100 images, 25 Mo) calculés sur les poids signés par le serveur.
 * @param raw Champ « uploads » du formulaire (JSON { cover, gallery }, non fiable).
 * @param secret Clé de signature (AUTH_SECRET par défaut).
 * @param now Horodatage (injectable pour les tests).
 * @returns Les chemins des images validées, ou la raison du refus.
 */
export function readUploadReceipts(raw: string, secret = secretFromEnv(), now = Date.now()): ReceiptBatch {
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return { ok: false, code: "invalid" };
  }
  const parsed = receiptBatchSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, code: "invalid" };
  const cover = parsed.data.cover == null ? null : verifyUploadReceipt(parsed.data.cover, secret, now);
  const gallery = parsed.data.gallery.map((receipt) => verifyUploadReceipt(receipt, secret, now));
  if ((parsed.data.cover != null && !cover) || gallery.some((receipt) => !receipt)) return { ok: false, code: "invalid" };
  const receipts = [cover, ...gallery].filter((receipt): receipt is UploadReceipt => receipt !== null);
  if (new Set(receipts.map((receipt) => receipt.src)).size !== receipts.length) return { ok: false, code: "duplicate" };
  const check = checkSubmission(receipts.map((receipt) => receipt.bytes));
  if (!check.ok) return { ok: false, code: "limits", check };
  return { ok: true, cover: cover?.src ?? null, gallery: receipts.slice(cover ? 1 : 0).map((receipt) => receipt.src) };
}
