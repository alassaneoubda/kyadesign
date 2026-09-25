import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function DemandesPage() {
  const requests = await prisma.contactRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const newlyOpened = requests.filter((item) => !item.read);
  if (newlyOpened.length > 0) {
    await prisma.contactRequest.updateMany({ where: { read: false }, data: { read: true } });
  }

  return (
    <>
      <header className="bo-page-head">
        <div>
          <p className="bo-kicker">Pilotage</p>
          <h1>Demandes</h1>
          <p className="bo-lead">
            Chaque formulaire du site arrive ici. Un e-mail part aussi vers ta boîte si Resend est configuré.
            {newlyOpened.length > 0 ? ` ${newlyOpened.length} nouvelle(s) demande(s) à l’ouverture.` : ""}
          </p>
        </div>
      </header>

      {requests.length === 0 ? (
        <p className="bo-empty">Aucune demande pour le moment.</p>
      ) : (
        <div className="bo-list">
          {requests.map((request) => {
            const wasNew = newlyOpened.some((item) => item.id === request.id);
            return (
              <article key={request.id} className={wasNew ? "is-unread" : undefined}>
                <div>
                  <strong>{request.name}</strong>
                  <p>
                    {formatDate(request.createdAt)} · {request.email}
                    {request.phone ? ` · ${request.phone}` : ""}
                  </p>
                  <p>{[request.projectType, request.budget, request.delay].filter(Boolean).join(" · ")}</p>
                  <p>{request.message}</p>
                </div>
                <span className={`bo-badge${request.emailSent ? "" : " is-warn"}`}>
                  {wasNew ? "Nouvelle" : request.emailSent ? "E-mail envoyé" : "Sans e-mail"}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
