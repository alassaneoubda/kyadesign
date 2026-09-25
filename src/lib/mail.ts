import { logError, logInfo } from "@/lib/log";

type ContactMail = {
  id: string;
  name: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  delay: string;
  message: string;
};

/**
 * Envoie la demande à Yohann via Resend.
 * Sans clé API, la demande reste enregistrée dans le back-office.
 * @param request Demande déjà enregistrée.
 * @returns Vrai si l'e-mail est accepté par Resend.
 */
export async function sendContactMail(request: ContactMail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !to || !from) {
    logInfo("contact.email_skipped", { requestId: request.id });
    return false;
  }

  const text = [
    `Nom: ${request.name}`,
    `Email: ${request.email}`,
    request.phone ? `Téléphone: ${request.phone}` : "",
    request.projectType ? `Type de projet: ${request.projectType}` : "",
    request.budget ? `Budget: ${request.budget}` : "",
    request.delay ? `Délai: ${request.delay}` : "",
    "",
    request.message,
  ].filter((line) => line !== "").join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: request.email,
        subject: `Nouvelle demande — ${request.name}`,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      logError("contact.email", new Error(`Resend ${response.status}`));
      return false;
    }
    logInfo("contact.email_sent", { requestId: request.id });
    return true;
  } catch (error) {
    logError("contact.email", error);
    return false;
  }
}
