# Changelog — Kya Design

## [0.4.0] — 2026-09-29

### Added
- Compteur de visites interne (sans service tiers) : bloc « Audience du site » sur le tableau de bord
  (aujourd'hui, 7 jours avec tendance, 30 jours, depuis le début) et histogramme des 30 derniers jours
- Endpoint `POST /api/visit` : ignore robots, back-office, administrateur connecté, appels d'une autre origine
  et site local ; visiteur compté une fois par jour via un cookie technique `kya_visit` (expire à minuit UTC)
- Table `VisitDay` (agrégats quotidiens, aucune IP ni donnée personnelle) —
  migration additive `prisma/sql/V20260929153000__compteur_visites.sql`
- Tests `src/lib/visits.test.ts`
- Avis laissés par les visiteurs : bouton « Laisser un avis » dans « Nos témoignages clients » ; l'avis arrive
  masqué dans `/admin/temoignages` (badge « à valider ») et n'est publié qu'après validation (bouton œil)
- Alerte « avis en attente de validation » sur le tableau de bord
- Anti-spam : champ piège, délai minimal de saisie, liens refusés, doublons ignorés, 10 avis/heure maximum,
  50 avis en attente maximum, un avis par navigateur et par jour — aucune donnée de contact ni IP stockée
- Colonne `Testimonial.source` (`admin` | `visitor`) — migration additive `prisma/sql/V20260929160000__avis_visiteurs.sql`
- Tests `src/lib/reviews.test.ts`

### Changed
- La section « Nos témoignages clients » est toujours affichée (invitation à laisser le premier avis s'il n'y en a aucun)

### Fixed
- Écran brut « This page couldn't load » lors d'une coupure passagère de la base de données :
  - page d'accueil servie depuis le cache (ISR, 5 min + rafraîchissement immédiat après chaque modification
    du back-office) : la dernière version réussie reste affichée si la base ne répond pas ;
  - chargement de l'accueil réessayé automatiquement (3 essais, attente croissante) ;
  - pages d'erreur `app/error.tsx` et `app/global-error.tsx` aux couleurs du site, avec nouvelle tentative
    automatique et bouton « Réessayer » ;
  - pool Postgres : délai de connexion 10 s, connexions inactives libérées après 10 s
- Tests `src/lib/retry.test.ts`

## [0.3.0] — 2026-09-29

### Added
- Section « À propos » refaite d'après la maquette : panneau sombre, forme jaune, portrait (détouré ou en arche),
  accroche manuscrite (Kaushan Script) modifiable, badge de rôle, chiffres clés et compétences avec icônes
- Section « Nos témoignages clients » (carrousel natif scroll-snap) + back-office `/admin/temoignages`
  (CRUD, photo facultative, visibilité) — aucun avis pré-rempli
- Back-office `/admin/reseaux` : réseaux sociaux (catalogue de 14 plateformes, icône, lien, ordre, visibilité)
- Bouton « Admin » dans la navigation publique (redirige vers la connexion existante)
- Bouton « œil » (visibilité) sur les réalisations, réseaux et témoignages — masquer ne supprime jamais
- Lien de navigation actif souligné, menu mobile animé, burger animé
- Animations d'apparition cohérentes (transform / opacity) et respect de `prefers-reduced-motion`
- Migration SQL additive `prisma/sql/V20260929__vitrine_reseaux_temoignages.sql`
- Tests `src/lib/showcase.test.ts` (e-mail facultatif, projet facultatif, visibilité, URL sûres, etc.)

### Changed
- Formulaire de contact : e-mail facultatif (format vérifié seulement s'il est saisi)
- Réalisations : tous les champs facultatifs (client, serveur, base) ; l'affichage public masque les blocs vides
- Création de réalisation : identifiant généré depuis le titre, jamais d'écrasement d'une réalisation existante
- Jauges « Logiciels maîtrisés » sans pourcentage, animées
- Icônes réseaux de la section contact pilotées par le back-office (liens validés http/https uniquement)
- Réglages : les champs réseaux sociaux de `SiteSetting` sont dépréciés (conservés en base, plus utilisés)

### Fixed
- Erreurs base de données non gérées lors de l'enregistrement d'une réalisation ou des réglages

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
