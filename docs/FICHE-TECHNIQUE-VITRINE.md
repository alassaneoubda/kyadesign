# Fiche technique — Refonte de la vitrine Kya Design

| | |
|---|---|
| **Version** | 0.3.0 |
| **Date** | 29 septembre 2026 |
| **Auteur** | Kya Design (développement assisté) |
| **Périmètre** | Site public + back-office |

---

## 1. Description fonctionnelle

La refonte modernise le site public et donne au propriétaire la main sur davantage de contenus, sans passer par un
développeur :

- une section **« À propos »** fidèle à la maquette validée (portrait, forme jaune, accroche manuscrite, chiffres clés,
  compétences) ;
- des **jauges de logiciels** animées, sans pourcentage affiché ;
- des **icônes de réseaux sociaux** cliquables, gérées depuis le back-office ;
- une section **« Nos témoignages clients »**, alimentée uniquement par de vrais avis saisis dans le back-office ;
- un **bouton « Admin »** dans le menu du site ;
- un **bouton « œil »** pour afficher ou masquer une réalisation, un réseau ou un témoignage **sans le supprimer** ;
- un **formulaire de contact** où l'e-mail devient facultatif ;
- des **fiches réalisations** dont tous les champs sont facultatifs.

## 2. Contexte métier

- Les visiteurs hésitaient à laisser leur e-mail : le contact passe surtout par WhatsApp. Rendre l'e-mail facultatif
  réduit les abandons de formulaire.
- Le propriétaire veut publier rapidement une réalisation, même incomplète, et pouvoir la retirer temporairement
  (client qui demande de la discrétion, pièce saisonnière) sans perdre le travail saisi.
- Les témoignages et les réseaux renforcent la confiance ; ils doivent pouvoir évoluer sans intervention technique.

## 3. Stack et dépendances

| Élément | Usage |
|---|---|
| Next.js 16 (App Router, Server Actions) | Pages, formulaires, contrôle d'accès côté serveur |
| React 19 (`useActionState`, `useOptimistic`) | Bouton œil avec mise à jour immédiate |
| Prisma 6 + PostgreSQL (Supabase) | Stockage des données |
| Zod | Validation stricte de toutes les saisies côté serveur |
| sharp | Conversion des images en WebP, détection du portrait détouré |
| Simple Icons (tracés copiés, licence CC0) | Logos des réseaux sociaux — **aucune dépendance ajoutée** |
| Google Fonts « Kaushan Script » | Accroche manuscrite de la section À propos |

Aucune bibliothèque d'animation n'a été ajoutée : les animations sont en CSS (transform / opacity).

## 4. Architecture

```
Visiteur ──> page d'accueil (serveur) ──> getHomeData() ──> base de données
                 │                         (filtre : visible = vrai, liens sûrs)
                 └─> composants : En-tête · À propos · Portfolio · Logiciels · Témoignages · Contact

Administrateur ──> /admin/* (session vérifiée côté serveur) ──> Server Actions ──> base de données
                                                                   └─> revalidation de la page d'accueil
```

Fichiers principaux :

- **Site public** : `src/components/site/` (`site-header`, `about-section`, `portfolio-section`, `software-section`,
  `testimonials-section`, `contact-section`, `icons`) et `src/app/vitrine.css`.
- **Back-office** : `src/app/admin/(panel)/projets`, `reseaux`, `temoignages`, `reglages` ;
  composants `visibility-toggle`, `confirm-submit`, `flash`.
- **Logique serveur** : `src/server/actions.ts`, `src/server/showcase-actions.ts`, `src/lib/validators.ts`,
  `src/lib/queries.ts`.

## 5. Actions serveur exposées (formulaires du back-office)

Toutes exigent une session administrateur valide ; sans session → redirection vers `/admin/login`.

| Action | Données envoyées | Résultat |
|---|---|---|
| `toggleVisibilityAction` | type (réalisation / réseau / témoignage), id, visible | Message de succès ou d'erreur (toast) |
| `saveProjectAction` | champs de la réalisation (tous facultatifs), images | `?ok=enregistre` ou `?erreur=format / image / introuvable / 1` |
| `saveSocialLinkAction` | réseau, lien https, nom, identifiant, ordre, visible | `?ok=enregistre` ou `?erreur=lien / reseau / 1` |
| `deleteSocialLinkAction` | id | `?ok=supprime` |
| `saveTestimonialAction` | nom, texte, fonction, entreprise, photo, ordre, visible | `?ok=enregistre` ou `?erreur=nom / texte / image / 1` |
| `deleteTestimonialAction` | id | `?ok=supprime` |
| `submitContactAction` (public) | nom, e-mail facultatif, téléphone, type, budget, message, consentement | Message affiché au visiteur |

## 6. Modèle de données (changements)

Migration **additive** (aucune colonne supprimée, aucune donnée perdue) :
`prisma/sql/V20260929__vitrine_reseaux_temoignages.sql` — **déjà appliquée** sur la base Supabase.

| Table | Changement |
|---|---|
| `Project` | nouvelle colonne `visible` (vrai par défaut → toutes les réalisations existantes restent affichées) ; champs texte avec valeur par défaut vide ; index `(visible, sortOrder)` |
| `SocialLink` (nouvelle) | `platform`, `label`, `handle`, `url`, `visible`, `sortOrder`, dates ; les 4 réseaux existants y ont été recopiés |
| `Testimonial` (nouvelle) | `name`, `role`, `company`, `quote`, `photo`, `visible`, `sortOrder`, dates — table vide au départ |
| `SiteSetting` | nouvelles colonnes `aboutTagline` (accroche) et `portraitCutout` (portrait détouré) ; anciennes colonnes réseaux **dépréciées** (conservées) |
| `ContactRequest` | `email` avec valeur par défaut vide (e-mail facultatif) |

## 7. Règles métier

- **Masquer ≠ supprimer** : l'œil change uniquement la colonne `visible`. La suppression reste un bouton distinct,
  avec confirmation.
- Le site public ne lit que les éléments visibles (filtre fait **côté serveur**, pas seulement à l'affichage).
- Réalisation : aucun champ obligatoire. Un champ vide n'apparaît pas sur le site (pas de « null », pas de bloc vide,
  pas de lien vide). Sans couverture, la carte affiche un visuel neutre « KYA ».
- Identifiant de réalisation : généré depuis le titre ; si déjà pris, suffixe `-2`, `-3`… (jamais d'écrasement).
- Réseau social : lien obligatoire, uniquement `http://` ou `https://` (les liens `javascript:` ou `data:` sont
  refusés), revérifié à l'affichage.
- Témoignage : nom (2 caractères min.) et texte (10 à 1 200 caractères) obligatoires ; fonction, entreprise et photo
  facultatives. La section publique est masquée tant qu'aucun témoignage n'est publié.
- Contact : e-mail facultatif, format vérifié seulement s'il est saisi ; nom, type de projet, budget, message et
  consentement restent obligatoires.
- Portrait : un PNG/WebP transparent active automatiquement le rendu « détouré » de la maquette ; sinon la photo
  est cadrée dans une arche.

## 8. Gestion des erreurs

| Code (URL `?erreur=`) | Signification affichée |
|---|---|
| `format` | Un champ n'est pas au bon format (ex. identifiant avec espaces) |
| `image` | L'image n'a pas pu être envoyée (format non accepté ou échec du stockage) |
| `introuvable` | L'élément a été supprimé entre-temps |
| `lien` | Lien de réseau invalide (doit commencer par https://) |
| `nom` / `texte` | Nom ou témoignage trop court / trop long |
| `1` | Erreur technique générique (journalisée côté serveur) |

Les messages affichés proviennent d'une liste fermée : aucun texte venant de l'URL n'est injecté dans la page.
Les erreurs techniques sont journalisées (`logError`) sans donnée personnelle brute.

## 9. Sécurité

- **Authentification** : système existant réutilisé (cookie de session `kya_admin` vérifié en base côté serveur).
  Chaque action appelle `requireAdmin()`. Un faux cookie est refusé (vérifié : redirection vers la connexion).
- Le bouton « Admin » n'est qu'un lien : il ne donne aucun droit.
- **Validation** : Zod sur toutes les entrées ; requêtes Prisma paramétrées (pas de SQL concaténé).
- **Liens externes** : `rel="noopener noreferrer"`, protocole http/https imposé.
- **Données personnelles** : l'e-mail du visiteur n'est plus exigé ; aucune donnée personnelle dans les URL.
- Aucun secret dans le code client.

## 10. Tests réalisés

| Type | Détail | Résultat |
|---|---|---|
| Unitaires (`npm test`) | 55 tests, dont `showcase.test.ts` : e-mail facultatif / invalide, projet vide accepté, visibilité, URL dangereuses refusées, témoignage, découpage du nom, icônes | 55 / 55 réussis |
| Typage (`tsc --noEmit`) | Projet complet | 0 erreur |
| Lint (`eslint src`) | Projet complet | 0 erreur (avertissements `<img>` préexistants) |
| Build production | `next build` | Réussi |
| Fonctionnels (navigateur, build local) | À propos desktop 1440 px et mobile 390 px, jauges, icônes réseaux, menu mobile, étude de cas, redirection `/admin/*` sans session | Conformes |

Non testé en conditions réelles (pour ne pas écrire dans la base de production partagée) : envoi réel du
formulaire de contact, bascule de l'œil et CRUD connectés au back-office.

## 11. Points d'attention

- Pour un rendu identique à la maquette, téléverser un portrait **détouré** (PNG/WebP transparent) dans
  Réglages → Photo de présentation.
- Les anciennes colonnes réseaux de `SiteSetting` pourront être supprimées dans une migration ultérieure.
