# Changelog — Kya Design

## [0.2.0] — 2026-09-25

### Added
- Stockage Cloudflare R2 pour albums, images publiques et CV
- `DIRECT_URL` Prisma pour migrations via pooler session Supabase

### Changed
- Base de données : SQLite → PostgreSQL (Supabase) via adaptateur `pg`
- Lecture médias / uploads / zip via R2 avec repli disque local
- Client Prisma sous Windows : SSL via `pg` (`rejectUnauthorized: false`)

### Fixed
- Erreurs ESLint (`Link`, scripts ignorés, variables inutilisées)
- `.env.example` nettoyé (plus de secrets)
