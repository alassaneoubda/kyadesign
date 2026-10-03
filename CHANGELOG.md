# Changelog — Kya Design

## [Unreleased]

### Added
- Réalisations : jusqu'à 100 images et 25 Mo (poids après optimisation) par enregistrement. Chaque image est
  envoyée seule (sous 4 Mo) vers `POST /api/admin/project-images` (administrateur connecté, même origine),
  qui renvoie un reçu signé ; l'enregistrement final ne transporte que ces reçus. Plafonds contrôlés dans le
  navigateur et recontrôlés côté serveur (voir `DECISIONS.md`, ADR-001, et
  `docs/FICHE-TECHNIQUE-UPLOAD-REALISATIONS.md`)
- Formulaire réalisation : progression de l'envoi, miniatures retirables, compteur « N / 100 images · X Mo sur
  25 Mo », message de réussite ou d'erreur à côté du bouton, formulaire verrouillé pendant l'envoi (pas de
  double soumission), images déjà envoyées non renvoyées après un échec, 3 tentatives sur coupure réseau
- Tests `upload-limits`, `upload-receipt` (falsification, doublon, plus de 100 images, plus de 25 Mo) et
  `upload-queue`

### Changed
- Titre du site et aperçu des liens partagés (WhatsApp, réseaux sociaux) : « Kya Design — Yohann Armel »,
  sans le nom de famille ; description, mots-clés et auteur alignés
- Section « À propos » : suppression de la forme jaune et du cadre en arche noir derrière le portrait ;
  la photo est posée directement sur le panneau sombre, bords fondus
- Formulaire de contact : nouvelles tranches de budget (10k–20k, 25k–40k, 50k–80k, 100k–300k, 300k–500k FCFA,
  À discuter)
- Academy : suppression du bloc « Modalités — Choisissez votre mode de formation » (le choix du mode reste
  disponible dans le formulaire d'inscription)

### Fixed
- Connexion au back-office refusée en production (« Identifiants incorrects ») quand `ADMIN_PASSWORD_HASH`
  est collé sur Vercel avec les `\$` de `.env` (ou entre guillemets) : le hash est désormais nettoyé avant
  comparaison. Chaque échec de connexion est journalisé avec sa raison (`not_configured`, `email`,
  `password`), sans e-mail ni mot de passe
- Création d'une réalisation bloquée ou « retour en haut de page » sans message : le navigateur refusait
  l'envoi (budget de 4 Mo sur le champ galerie, format imposé sur l'identifiant) et remontait vers le champ
  fautif. Tous les champs sont désormais facultatifs (identifiant libre, converti côté serveur), l'ordre
  d'affichage est aligné sur la limite serveur (0–999) et la page n'est plus rechargée à l'enregistrement
- Impossible d'enregistrer une réalisation avec de grosses photos (« L'image n'a pas pu être envoyée ») :
  les images sont réduites dans le navigateur avant l'envoi (1200 px, WebP) pour rester sous la limite
  de 4,5 Mo par requête de l'hébergeur
- Messages d'erreur précis à l'enregistrement d'une réalisation (format non pris en charge, fichier trop lourd,
  image illisible, stockage indisponible) au lieu d'un message générique
- Tests `src/lib/image-prep.test.ts` et `src/lib/storage.test.ts` (grosse photo, image abîmée, format HEIC,
  fichier de plus de 25 Mo)
- Nouvelle tentative réussie de chargement de l'accueil journalisée en avertissement (`logWarn`) et non plus en
  erreur : elle n'apparaît plus comme « Console Error » dans l'écran de développement
- Site local : connexions à la base conservées 2 min (au lieu de 10 s) avec keep-alive, car leur ouverture
  depuis le poste peut prendre plusieurs secondes ; réglage production inchangé
- Tests `src/lib/log.test.ts`

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
