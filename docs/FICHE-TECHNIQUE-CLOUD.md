# Fiche technique — Intégration Postgres + R2

## Titre
Passage du site KYA Design en stack cloud (Supabase Postgres + Cloudflare R2 + Resend)

## Description fonctionnelle
Le back-office et le site public utilisent une base Postgres hébergée (Supabase) et stockent les photos / images sur Cloudflare R2, tout en conservant Resend pour les e-mails de contact.

## Contexte métier
Le déploiement sur Vercel n’autorise pas un stockage disque durable. Les albums clients (100–200 originaux) et les visuels du site doivent donc vivre hors du serveur applicatif.

## Stack et dépendances
- Next.js 16 / React 19 / TypeScript
- Prisma 6 + PostgreSQL (Supabase)
- Cloudflare R2 via `@aws-sdk/client-s3@3.787.0`
- Resend (HTTP API)
- Sharp (dérivés WebP)

## Architecture
1. Formulaire / upload admin → `storage.ts`
2. Si `R2_*` configurés → écriture R2 ; sinon → `storage/` local
3. Lecture médias → `/api/media`, `/api/uploads`, `/api/cv`, zip albums
4. Contenu éditorial → Prisma → Postgres

## Variables d’environnement
Voir `.env.example` : `DATABASE_URL`, `DIRECT_URL`, `R2_*`, `RESEND_*`, auth admin/CV.

## Sécurité
- Pas de secrets dans le code source
- Albums privés protégés par code session
- Originaux servis en attachment après contrôle d’accès

## Mise en service
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Si `prisma db push` échoue (P1001) : vérifier que le projet Supabase est actif et que les ports 5432/6543 ne sont pas bloqués sur le réseau local. Sur Vercel, renseigner les mêmes variables d’environnement.

## Auteur / date / version
Yohann Armel Koukoui / Kya Design — 2026-09-25 — v0.2.0
