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
 * Lien WhatsApp avec message prérempli. Le numéro ne contient que des chiffres.
 * @param phoneDigits Indicatif et numéro, sans espaces.
 * @param message Texte du message.
 * @returns URL wa.me.
 */
export function whatsappHref(phoneDigits: string, message: string): string {
  const phone = phoneDigits.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
