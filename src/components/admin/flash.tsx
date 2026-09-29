/**
 * Message de retour du back-office (succès / erreur) lu depuis les paramètres ?ok= / ?erreur=.
 * Seules les clés connues sont affichées : aucun texte arbitraire venant de l'URL.
 * Auteur : Kya Design — 2026-09-29 — v1
 */

type Query = Record<string, string | string[] | undefined>;

/**
 * @param props.query Paramètres de recherche de la page.
 * @param props.ok Messages de succès, par clé de ?ok=.
 * @param props.errors Messages d'erreur, par clé de ?erreur= (clé « 1 » = erreur générique).
 */
export function Flash({ query, ok, errors }: {
  query: Query;
  ok: Record<string, string>;
  errors: Record<string, string>;
}) {
  const okKey = typeof query.ok === "string" ? query.ok : "";
  const errorKey = typeof query.erreur === "string" ? query.erreur : "";
  const error = errorKey ? (errors[errorKey] ?? errors["1"] ?? "Une erreur est survenue.") : "";
  const success = okKey ? ok[okKey] : "";
  if (error) {
    return (
      <p className="bo-flash is-error" role="alert">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="bo-flash is-ok" role="status">
        {success}
      </p>
    );
  }
  return null;
}
