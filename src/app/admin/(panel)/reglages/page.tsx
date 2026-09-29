/**
 * Back-office — textes, médias et contact du site.
 * Auteur : Yohann Armel Koukoui / Kya Design — 2026-09-25 — v2
 */
import { prisma } from "@/lib/prisma";
import { saveSettingsAction } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!setting) return <p>Contenu absent. Lance npm run db:setup.</p>;

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Réglages</p>
          <h1>Textes, images et contact</h1>
          <p className="bo-lead">
            Hero, portrait, CV PDF, coordonnées et textes affichés sur le site.
          </p>
        </div>
      </header>

      {query.ok && <p className="bo-success">Enregistré.</p>}
      {query.erreur && <p className="bo-error">Certains champs sont invalides ou le fichier est refusé.</p>}

      <form className="bo-form" action={saveSettingsAction} encType="multipart/form-data">
        <h2>Images principales</h2>
        <div className="bo-form-grid">
          <label className="full">
            Image hero (plein écran)
            <input name="heroImage" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" />
          </label>
          {setting.heroImage ? (
            <div className="full">
              <img src={setting.heroImage} alt="" style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
            </div>
          ) : null}
          <label className="full">
            Photo de présentation (À propos)
            <input name="portraitImage" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" />
          </label>
          <p className="full bo-hint">
            Astuce : un PNG ou WebP <strong>détouré (fond transparent)</strong> reproduit exactement la maquette — le
            portrait déborde de la forme jaune. Une photo classique est automatiquement cadrée dans une arche.
          </p>
          {setting.portraitImage ? (
            <div className="full bo-cover-preview">
              <img
                src={setting.portraitImage}
                alt=""
                style={{ width: 180, height: 240, objectFit: setting.portraitCutout ? "contain" : "cover" }}
              />
              <span className="bo-badge">{setting.portraitCutout ? "Portrait détouré" : "Photo cadrée (arche)"}</span>
            </div>
          ) : null}
          <label className="full">
            Fichier CV (PDF)
            <input name="cvFile" type="file" accept="application/pdf,.pdf" />
          </label>
          <p className="full" style={{ color: "var(--bo-muted)", margin: 0 }}>
            CV actuel : <strong>{setting.cvFileName}</strong>
          </p>
        </div>

        <h2>Textes</h2>
        <div className="bo-form-grid">
          <label>
            Nom affiché
            <input name="aboutName" defaultValue={setting.aboutName} required />
          </label>
          <label>
            Rôle
            <input name="aboutRole" defaultValue={setting.aboutRole} required />
          </label>
          <label className="full">
            Accroche manuscrite (À propos) — un retour à la ligne par ligne, vide pour masquer
            <textarea name="aboutTagline" rows={3} maxLength={120} defaultValue={setting.aboutTagline} />
          </label>
          <label className="full">
            Pied de page
            <input name="footerLine" defaultValue={setting.footerLine} required />
          </label>
          <label className="full">
            Introduction
            <textarea name="aboutIntro" rows={4} defaultValue={setting.aboutIntro} required />
          </label>
          <label className="full">
            Approche
            <textarea name="aboutApproach" rows={3} defaultValue={setting.aboutApproach} required />
          </label>
          <label className="full">
            Expérience
            <textarea name="aboutExperience" rows={3} defaultValue={setting.aboutExperience} required />
          </label>
        </div>

        <h2>Contact</h2>
        <div className="bo-form-grid">
          <label>
            Téléphone (chat WhatsApp prérempli)
            <input name="phone" defaultValue={setting.phone} required />
          </label>
          <label>
            Localisation
            <input name="contactLocation" defaultValue={setting.contactLocation} required />
          </label>
          <label>
            WhatsApp (lien affichage)
            <input name="whatsapp" defaultValue={setting.whatsapp} required />
          </label>
          <label>
            WhatsApp (texte)
            <input name="whatsappDisplay" defaultValue={setting.whatsappDisplay} required />
          </label>
          <label className="full">
            Email
            <input name="email" type="email" defaultValue={setting.email} required />
          </label>
          <p className="full bo-hint">
            Les réseaux sociaux (Instagram, TikTok, LinkedIn…) se gèrent désormais dans{" "}
            <a href="/admin/reseaux">Réseaux sociaux</a> : ajout, icône, ordre et visibilité.
          </p>
        </div>

        <div className="bo-form-actions">
          <button className="btn" type="submit">
            Enregistrer
          </button>
        </div>
      </form>
    </>
  );
}
