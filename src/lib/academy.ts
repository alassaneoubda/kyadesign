/**
 * Messages WhatsApp et règles de sélection des albums.
 * Fonctions pures, testées sans base de données.
 */

export type AcademyKind = "formation" | "pack";

export type AcademyChoice = {
  kind: AcademyKind;
  title: string;
  mode: string;
};

/**
 * Construit le message envoyé à Yohann selon la formation ou le pack choisi.
 * @param choice Formation ou pack, avec le mode en ligne ou présentiel.
 * @returns Texte prêt à être encodé dans le lien WhatsApp.
 */
export function buildAcademyMessage(choice: AcademyChoice): string {
  const mode = choice.mode.trim();
  if (choice.kind === "pack") {
    return [
      "Bonjour Yohann,",
      `Je suis intéressé(e) par le ${choice.title} de KYA Design Academy.`,
      `Mode de formation souhaité : ${mode}`,
      "Je souhaiterais connaître le prix et les disponibilités.",
      "Merci.",
    ].join("\n");
  }
  return [
    "Bonjour Yohann,",
    `Je suis intéressé(e) par la formation ${choice.title} de KYA Design Academy.`,
    `Mode de formation souhaité : ${mode}`,
    "Je souhaiterais connaître le prix et les modalités de formation.",
    "Merci.",
  ].join("\n");
}

/**
 * Lien WhatsApp avec message prérempli.
 * Accepte un numéro (+225…) ou une URL click-to-chat (wa.me/message/…).
 * @param phoneOrUrl Numéro ou URL WhatsApp stockée dans les réglages.
 * @param message Texte du message.
 * @returns URL wa.me prête à ouvrir.
 */
export function whatsappHref(phoneOrUrl: string, message: string): string {
  const trimmed = phoneOrUrl.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      url.searchParams.set("text", message);
      return url.toString();
    } catch {
      return `${trimmed}${trimmed.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}`;
    }
  }
  const phone = trimmed.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export type ContactBrief = {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  delay: string;
  message: string;
};

/**
 * Construit le brief contact à préremplir dans WhatsApp.
 * @param brief Champs du formulaire contact.
 * @returns Texte prêt pour wa.me.
 */
export function buildContactMessage(brief: ContactBrief): string {
  const lines = [
    "Bonjour Yohann,",
    "Nouvelle demande via le site Kya Design :",
    "",
    `Nom : ${brief.name.trim()}`,
    `Email : ${brief.email.trim()}`,
  ];
  if (brief.phone.trim()) lines.push(`Téléphone : ${brief.phone.trim()}`);
  if (brief.projectType.trim()) lines.push(`Type de projet : ${brief.projectType.trim()}`);
  if (brief.budget.trim()) lines.push(`Budget : ${brief.budget.trim()}`);
  if (brief.delay.trim()) lines.push(`Délai : ${brief.delay.trim()}`);
  lines.push("", "Message :", brief.message.trim());
  return lines.join("\n");
}

/**
 * Indique si l'invité peut encore ajouter une photo à sa sélection.
 * @param selected Nombre déjà choisi.
 * @param max Plafond défini par le photographe.
 */
export function selectionState(selected: number, max: number): { canAdd: boolean; label: string } {
  const safeMax = Math.max(0, max);
  const safeSelected = Math.max(0, Math.min(selected, safeMax));
  return {
    canAdd: safeSelected < safeMax,
    label: `${safeSelected} / ${safeMax}`,
  };
}
