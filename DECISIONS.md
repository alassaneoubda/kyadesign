# Décisions d'architecture — Kya Design

Format ADR (Architecture Decision Record). Une décision acceptée n'est pas réécrite : on en ajoute une nouvelle
qui la remplace.

---

## ADR-001 — Envoi des images de réalisation une par une, avec reçus signés

- **Date** : 2026-09-30
- **Statut** : acceptée

### Contexte
Le back-office doit accepter jusqu'à **100 images et 25 Mo par enregistrement** d'une réalisation.
Le site est hébergé sur Vercel, qui refuse toute requête de plus de **4,5 Mo** (erreur 413
`FUNCTION_PAYLOAD_TOO_LARGE`), quel que soit le réglage `serverActions.bodySizeLimit` de Next.js. Une seule
requête contenant toutes les images est donc impossible en production. Le stockage (Cloudflare R2) ne doit
pas changer.

### Options étudiées
1. **Tout envoyer dans l'action serveur** : fonctionne en local, échoue sur Vercel au-delà de 4,5 Mo. Rejetée.
2. **Envoi direct du navigateur vers R2 (URL présignées)** : contourne la limite, mais impose d'ouvrir le
   bucket au CORS et supprime le contrôle serveur des fichiers (format réel, image lisible, recompression,
   suppression des métadonnées EXIF). Rejetée pour ces raisons de sécurité et de configuration.
3. **Envoi image par image vers une route serveur authentifiée** : chaque requête reste sous 4 Mo, le serveur
   garde tous ses contrôles et le stockage ne change pas. **Retenue.**

### Décision
- Le navigateur réduit chaque image (1200 px, WebP), puis l'envoie seule à `POST /api/admin/project-images`
  (4 envois en parallèle, 3 tentatives sur erreur réseau ou serveur temporaire).
- La route vérifie la session administrateur et l'origine, valide et recompresse l'image (sharp), la stocke
  sur R2 et renvoie un **reçu signé** (HMAC-SHA256 avec `AUTH_SECRET`, valable 24 h) contenant le chemin et
  le poids reçu.
- L'enregistrement final (action serveur) ne transporte que les reçus : il vérifie chaque signature, refuse
  les doublons, puis recontrôle les plafonds (100 images, 25 Mo) à partir des poids signés.
- Les plafonds sont définis une seule fois dans `src/lib/upload-limits.ts`, partagé par le navigateur et le
  serveur.

### Conséquences
- (+) Compatible Vercel ; aucune modification du bucket R2 ; contrôles serveur conservés.
- (+) Un échec partiel ne fait pas tout renvoyer : les images déjà envoyées sont réutilisées.
- (−) Une image envoyée puis abandonnée (formulaire non enregistré) reste sur R2 sans être référencée.
  Un nettoyage périodique des fichiers orphelins du dossier `uploads/creations/` est à prévoir.
- (−) Les autres formulaires à fichiers (CV PDF, visuels services/formations/packs) passent encore par
  une requête unique et restent soumis à la limite de 4,5 Mo de Vercel.
