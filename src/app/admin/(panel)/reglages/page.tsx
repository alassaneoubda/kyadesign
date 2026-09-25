import { prisma } from "@/lib/prisma";
import { saveSettingsAction } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/admin/reglages">) {
  const query = await searchParams;
  const setting = await prisma.siteSetting.findUnique({ where: { id: 1 } });
  if (!setting) return <p>Contenu absent. Lance npm run db:setup.</p>;

  return (
    <>
      <h1>Textes et contact</h1>
      {query.ok && <p>Enregistré.</p>}
      {query.erreur && <p className="bo-error">Certains champs sont invalides.</p>}
      <form className="bo-form" action={saveSettingsAction}>
        <label>Nom affiché<input name="aboutName" defaultValue={setting.aboutName} /></label>
        <label>Rôle<input name="aboutRole" defaultValue={setting.aboutRole} /></label>
        <label>Pied de page<input name="footerLine" defaultValue={setting.footerLine} /></label>
        <label>Introduction<textarea name="aboutIntro" rows={4} defaultValue={setting.aboutIntro} /></label>
        <label>Approche<textarea name="aboutApproach" rows={3} defaultValue={setting.aboutApproach} /></label>
        <label>Expérience<textarea name="aboutExperience" rows={3} defaultValue={setting.aboutExperience} /></label>
        <label>Téléphone<input name="phone" defaultValue={setting.phone} /></label>
        <label>WhatsApp (lien)<input name="whatsapp" defaultValue={setting.whatsapp} /></label>
        <label>WhatsApp (texte)<input name="whatsappDisplay" defaultValue={setting.whatsappDisplay} /></label>
        <label>Email<input name="email" defaultValue={setting.email} /></label>
        <label>Instagram<input name="instagram" defaultValue={setting.instagram} /></label>
        <label>Compte Instagram<input name="instagramHandle" defaultValue={setting.instagramHandle} /></label>
        <label>TikTok<input name="tiktok" defaultValue={setting.tiktok} /></label>
        <label>Compte TikTok<input name="tiktokHandle" defaultValue={setting.tiktokHandle} /></label>
        <label>Behance<input name="behance" defaultValue={setting.behance} /></label>
        <label>Compte Behance<input name="behanceHandle" defaultValue={setting.behanceHandle} /></label>
        <label>Localisation<input name="contactLocation" defaultValue={setting.contactLocation} /></label>
        <button className="btn" type="submit">Enregistrer</button>
      </form>
    </>
  );
}
