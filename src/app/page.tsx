/**
 * Page d'accueil (vitrine publique).
 * Servie depuis le cache (ISR) : si la base de données est momentanément injoignable, la dernière
 * version réussie reste affichée. Chaque modification du back-office rafraîchit la page
 * immédiatement (revalidatePath("/")) ; sinon, régénération au plus toutes les 5 minutes.
 * Auteur : Kya Design — 2026-09-29 — v2
 */
import { HomeClient } from "@/components/site/home-client";
import { logError } from "@/lib/log";
import { getHomeData } from "@/lib/queries";
import { withRetry } from "@/lib/retry";

export const revalidate = 300;

export default async function Page() {
  const data = await withRetry(getHomeData, {
    onRetry: (error, attempt) => logError(`home.load.retry${attempt}`, error),
  });
  return <HomeClient data={data} />;
}
