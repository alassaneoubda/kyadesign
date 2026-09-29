/**
 * Tableau de bord — audience du site : visiteurs et pages vues (aujourd'hui, 7 j, 30 j, total)
 * et histogramme des 30 derniers jours.
 * Auteur : Kya Design — 2026-09-29 — v1
 */
import type { CSSProperties } from "react";
import type { VisitStats } from "@/server/visits";

const NUMBER = new Intl.NumberFormat("fr-FR");
const DAY_LABEL = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

function dayLabel(key: string): string {
  return DAY_LABEL.format(new Date(`${key}T00:00:00Z`));
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const sign = value > 0 ? "+" : "";
  const tone = value > 0 ? " is-up" : value < 0 ? " is-down" : "";
  return (
    <em className={`bo-visits-trend${tone}`} title="Par rapport aux 7 jours précédents">
      {sign}
      {value} %
    </em>
  );
}

/**
 * @param props.stats Statistiques calculées côté serveur (null si la lecture a échoué).
 */
export function VisitsPanel({ stats }: { stats: VisitStats | null }) {
  if (!stats) {
    return (
      <section className="bo-panel bo-visits">
        <div className="bo-panel-head">
          <h2>Audience du site</h2>
        </div>
        <p className="bo-empty">Statistiques momentanément indisponibles. Recharge la page dans un instant.</p>
      </section>
    );
  }

  const max = Math.max(1, ...stats.series.map((point) => point.views));
  const hasVisits = stats.series.some((point) => point.views > 0);
  const cards = [
    { label: "Aujourd'hui", totals: stats.today, trend: null },
    { label: "7 derniers jours", totals: stats.last7, trend: stats.trend7 },
    { label: "30 derniers jours", totals: stats.last30, trend: null },
    { label: "Depuis le début", totals: stats.allTime, trend: null },
  ];
  const first = stats.series[0];
  const last = stats.series.at(-1);

  return (
    <section className="bo-panel bo-visits" aria-labelledby="bo-visits-title">
      <div className="bo-panel-head">
        <h2 id="bo-visits-title">Audience du site</h2>
        <span className="bo-visits-legend">
          <i className="is-visitors" /> Visiteurs <i className="is-views" /> Pages vues
        </span>
      </div>

      <div className="bo-visits-cards">
        {cards.map((card) => (
          <article className="bo-visits-card" key={card.label}>
            <span>{card.label}</span>
            <strong>
              {NUMBER.format(card.totals.visitors)}
              <TrendBadge value={card.trend} />
            </strong>
            <small>
              visiteur{card.totals.visitors > 1 ? "s" : ""} · {NUMBER.format(card.totals.views)} page
              {card.totals.views > 1 ? "s" : ""} vue{card.totals.views > 1 ? "s" : ""}
            </small>
          </article>
        ))}
      </div>

      <div className="bo-visits-chart" role="img" aria-label="Visiteurs et pages vues par jour sur les 30 derniers jours">
        {stats.series.map((point) => (
          <div
            className="bo-visits-bar"
            key={point.key}
            title={`${dayLabel(point.key)} : ${point.visitors} visiteur(s) · ${point.views} page(s) vue(s)`}
            style={
              {
                ["--views" as string]: point.views / max,
                ["--visitors" as string]: point.visitors / max,
              } as CSSProperties
            }
          >
            <span className="is-views" />
            <span className="is-visitors" />
          </div>
        ))}
        {hasVisits ? null : (
          <p className="bo-visits-empty">
            Aucune visite enregistrée sur les 30 derniers jours. Les chiffres apparaîtront dès les premières visites
            sur le site en ligne.
          </p>
        )}
      </div>
      {first && last ? (
        <div className="bo-visits-axis">
          <span>{dayLabel(first.key)}</span>
          <span>Aujourd&apos;hui</span>
        </div>
      ) : null}
      <p className="bo-hint">
        Un visiteur est compté une fois par jour. Les robots, le back-office et tes propres visites lorsque tu es
        connecté ne sont pas comptés. Aucune donnée personnelle n&apos;est enregistrée.
      </p>
    </section>
  );
}
