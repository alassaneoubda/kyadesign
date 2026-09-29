-- ============================================================================
-- V20260929160000 — Avis laissés par les visiteurs (témoignages modérés).
-- Auteur : Kya Design — 2026-09-29 — v1
--
-- "source" distingue un avis saisi dans le back-office ('admin') d'un avis envoyé
-- depuis le site par un visiteur ('visitor'). Un avis visiteur arrive masqué
-- (visible = false) et n'est publié qu'après validation par l'administrateur.
-- Aucune donnée de contact (e-mail, téléphone, IP) n'est stockée.
-- Migration ADDITIVE et IDEMPOTENTE (rejouable sans effet de bord).
-- ============================================================================

ALTER TABLE "public"."Testimonial"
    ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'admin';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Testimonial_source_check') THEN
        ALTER TABLE "public"."Testimonial"
            ADD CONSTRAINT "Testimonial_source_check" CHECK ("source" IN ('admin', 'visitor'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Testimonial_source_createdAt_idx"
    ON "public"."Testimonial" ("source", "createdAt");
