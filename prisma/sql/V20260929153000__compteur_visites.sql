-- ============================================================================
-- V20260929153000 — Compteur de visites du site (tableau de bord back-office).
-- Auteur : Kya Design — 2026-09-29 — v1
--
-- Une ligne par jour (UTC) : pages vues + visiteurs uniques du jour.
-- Aucune adresse IP, aucun identifiant de visiteur, aucune donnée personnelle.
-- Migration ADDITIVE et IDEMPOTENTE (rejouable sans effet de bord).
-- ============================================================================

CREATE TABLE IF NOT EXISTS "public"."VisitDay" (
    "day"       DATE         NOT NULL,
    "views"     INTEGER      NOT NULL DEFAULT 0,
    "visitors"  INTEGER      NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VisitDay_pkey" PRIMARY KEY ("day"),
    CONSTRAINT "VisitDay_counts_check" CHECK ("views" >= 0 AND "visitors" >= 0)
);
