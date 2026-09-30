# Fiche technique — Enregistrement des réalisations et envoi des images

- **Auteur** : Kya Design
- **Date de création** : 2026-09-30
- **Version** : 1.0

## Titre et description fonctionnelle
Formulaire « Réalisations » du back-office : création et modification d'un projet du portfolio (textes,
couverture, galerie). Tous les champs sont facultatifs. Une réalisation peut contenir jusqu'à
**100 images pour 25 Mo au total** par enregistrement.

## Contexte métier
Le formulaire se bloquait ou remontait en haut de la page sans explication, et refusait les galeries
de plus de 4 Mo. Les réalisations photo (mariages, événements) comportent souvent des dizaines de photos
prises au téléphone ou à l'appareil photo, chacune pesant plusieurs Mo.

## Stack et dépendances
- Next.js 16 (App Router, action serveur `saveProjectAction`), React 19, TypeScript
- Prisma 6 / PostgreSQL (Supabase) : tables `Project` et `ProjectImage`
- Cloudflare R2 (stockage des images), `sharp` (contrôle et recompression), `zod` (validation)
- Hébergement Vercel

## Architecture et flux de données
1. L'administrateur choisit ses images : le navigateur les réduit (1200 px, WebP) et affiche le poids réel
   qui sera envoyé (« N / 100 images · X Mo sur 25 Mo »).
2. Au clic sur « Publier » : contrôle des plafonds, puis envoi **d'une image par requête** (4 en parallèle)
   vers la route d'envoi. Le bouton affiche « Envoi des images x/y… ».
3. Pour chaque image, le serveur vérifie la session et l'origine, contrôle et recompresse l'image, la stocke
   sur R2 et renvoie un **reçu signé**.
4. Le formulaire envoie ensuite les textes et les reçus à l'action serveur, qui vérifie les reçus et les
   plafonds, puis enregistre la réalisation et sa galerie en une seule transaction.
5. Le résultat s'affiche à côté du bouton, sans rechargement de page.

Composants : `project-form.tsx`, `image-input.tsx`, `project-upload.ts` (navigateur) ;
`api/admin/project-images/route.ts`, `server/actions.ts` (serveur) ; `upload-limits.ts`, `upload-receipt.ts`,
`upload-queue.ts` (règles partagées).

## Endpoints
| Méthode | URL | Entrée | Réponse |
|---|---|---|---|
| POST | `/api/admin/project-images` | `multipart/form-data`, champ `file` (une image, 4 Mo max) | `{ success, data: { src, bytes, iat, sig }, timestamp, traceId }` |
| Action serveur | `saveProjectAction` (page `/admin/projets`) | champs texte + `uploads` (reçus JSON) | `{ ok, projectId }` ou `{ error }` |

Codes de la route d'envoi : 200 (image stockée), 400 (aucun fichier), 401 (non connecté), 403 (autre site),
405 (autre méthode que POST), 413 (image de plus de 4 Mo), 422 (format refusé ou image illisible),
502 (stockage indisponible).

## Modèle de données
- `Project` : `id` (identifiant lisible généré depuis le titre ou saisi librement), `title`, `categoryId`,
  `year`, `clientName`, `role`, `cover`, `featured`, `visible`, `tags`, textes du récit, `sortOrder`.
- `ProjectImage` : `projectId`, `src`, `sortOrder` (suppression en cascade avec la réalisation).
Aucune modification de schéma.

## Règles métier et contraintes
- Tous les champs sont facultatifs ; un champ vide est simplement masqué sur le site.
- 100 images maximum (couverture comprise), 25 Mo maximum au total, 4 Mo maximum par image après
  optimisation. Ces plafonds sont vérifiés dans le navigateur **et** sur le serveur.
- Formats acceptés : JPG, PNG, WebP, TIFF. Les photos HEIC d'iPhone doivent être exportées en JPG.
- Ordre d'affichage : 0 à 999.

## Gestion des erreurs (messages affichés)
- Plus de 100 images, ou plus de 25 Mo : message indiquant combien retirer ; rien n'est envoyé.
- Image refusée ou illisible : nom du fichier et raison ; les autres images déjà envoyées ne sont pas
  renvoyées au prochain essai.
- Coupure réseau : 3 tentatives par image, puis message « connexion interrompue ou trop lente ».
- Reçu expiré ou falsifié, image en double, champ trop long, base de données injoignable : message dédié.
Dans tous les cas la saisie est conservée et la page ne bouge pas.

## Sécurité
- Route d'envoi et action serveur réservées à l'administrateur connecté ; requêtes d'un autre site refusées.
- Le serveur contrôle le contenu réel de chaque image (pas seulement son extension) et la recompresse,
  ce qui supprime les métadonnées (position GPS des photos, etc.).
- Les reçus signés empêchent d'attacher une image non contrôlée ou de mentir sur son poids ; la clé
  (`AUTH_SECRET`) reste côté serveur. Aucune donnée personnelle n'est journalisée.

## Tests couverts
- Automatiques (132 tests, `npm test`) : plafonds, reçus (signature, falsification, expiration, doublon,
  101 images, plus de 25 Mo), file d'envoi (ordre, parallélisme, reprise), réduction d'image, validation.
- Réels (serveur de production local, navigateur) : champs vides, partiels, complets ; 1, 11 et 100 images ;
  101 images ; plus de 25 Mo ; HEIC, faux JPEG, fichier abîmé ; coupure réseau puis reprise ; clics
  multiples ; erreur serveur affichée sans déplacement ; modification d'une réalisation existante ;
  route d'envoi sans session (401), depuis un autre site (403).

## Limites connues
- Une image envoyée dont l'enregistrement est abandonné reste sur R2 (fichier orphelin, non visible sur le site).
- Les autres formulaires à fichiers (CV, visuels services/formations/packs) restent limités à 4,5 Mo par Vercel.
