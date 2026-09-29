-- ============================================================================
-- V20260929 — Vitrine : réseaux sociaux dynamiques, témoignages, visibilité
--             des réalisations, champs facultatifs, e-mail contact facultatif.
-- Auteur : Kya Design — 2026-09-29 — v1
--
-- Migration ADDITIVE et IDEMPOTENTE (rejouable sans effet de bord) :
--   · aucune colonne supprimée ni renommée ;
--   · les nouvelles colonnes ont une valeur par défaut → les lignes existantes
--     restent valides et le code déjà déployé continue de fonctionner ;
--   · Project.visible = true par défaut → aucune réalisation existante ne
--     disparaît du site.
-- ============================================================================

-- ─── SiteSetting : accroche « À propos » + type de portrait ───────────────────
ALTER TABLE "public"."SiteSetting"
    ADD COLUMN IF NOT EXISTS "aboutTagline" TEXT NOT NULL DEFAULT E'Créer\ndes visuels\nqui ont du sens';
ALTER TABLE "public"."SiteSetting"
    ADD COLUMN IF NOT EXISTS "portraitCutout" BOOLEAN NOT NULL DEFAULT false;

-- ─── Project : visibilité + champs facultatifs (valeur vide par défaut) ───────
ALTER TABLE "public"."Project" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "public"."Project" ALTER COLUMN "title" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "categoryId" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "year" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "clientName" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "role" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "cover" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "tags" SET DEFAULT '[]';
ALTER TABLE "public"."Project" ALTER COLUMN "probleme" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "concept" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "creation" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "resultat" SET DEFAULT '';
ALTER TABLE "public"."Project" ALTER COLUMN "sortOrder" SET DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Project_visible_sortOrder_idx" ON "public"."Project"("visible", "sortOrder");

-- ─── ContactRequest : e-mail facultatif ───────────────────────────────────────
ALTER TABLE "public"."ContactRequest" ALTER COLUMN "email" SET DEFAULT '';

-- ─── SocialLink : réseaux sociaux gérés depuis le back-office ─────────────────
CREATE TABLE IF NOT EXISTS "public"."SocialLink" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "handle" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialLink_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SocialLink_visible_sortOrder_idx" ON "public"."SocialLink"("visible", "sortOrder");

-- ─── Testimonial : témoignages clients ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."Testimonial" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "company" TEXT NOT NULL DEFAULT '',
    "quote" TEXT NOT NULL,
    "photo" TEXT NOT NULL DEFAULT '',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Testimonial_visible_sortOrder_idx" ON "public"."Testimonial"("visible", "sortOrder");

-- ─── Reprise des réseaux déjà configurés dans SiteSetting ─────────────────────
-- Exécutée une seule fois : uniquement si SocialLink est encore vide.
INSERT INTO "public"."SocialLink" ("id", "platform", "label", "handle", "url", "visible", "sortOrder", "updatedAt")
SELECT v.id, v.platform, v.label, v.handle, v.url, true, v.ord, CURRENT_TIMESTAMP
FROM "public"."SiteSetting" s
CROSS JOIN LATERAL (VALUES
    ('social-instagram', 'instagram', 'Instagram', s."instagramHandle", s."instagram", 1),
    ('social-tiktok',    'tiktok',    'TikTok',    s."tiktokHandle",    s."tiktok",    2),
    ('social-behance',   'behance',   'Behance',   s."behanceHandle",   s."behance",   3),
    ('social-linkedin',  'linkedin',  'LinkedIn',  s."linkedinHandle",  s."linkedin",  4)
) AS v(id, platform, label, handle, url, ord)
WHERE s."id" = 1
  AND v.url <> ''
  AND NOT EXISTS (SELECT 1 FROM "public"."SocialLink");
