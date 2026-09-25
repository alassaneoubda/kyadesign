"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { label: string; href: string; badge?: number };

const groups: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { label: "Tableau de bord", href: "/admin" },
      { label: "Demandes", href: "/admin/demandes" },
    ],
  },
  {
    title: "Contenu",
    items: [
      { label: "Albums privés", href: "/admin/albums" },
      { label: "Réalisations", href: "/admin/projets" },
      { label: "Catégories", href: "/admin/categories" },
      { label: "Formations", href: "/admin/formations" },
      { label: "Packs", href: "/admin/packs" },
      { label: "Modes", href: "/admin/modes" },
      { label: "Services", href: "/admin/services" },
      { label: "Logiciels", href: "/admin/logiciels" },
    ],
  },
  {
    title: "Réglages",
    items: [{ label: "Textes et contact", href: "/admin/reglages" }],
  },
];

/**
 * Navigation du back-office avec état actif et badge demandes non lues.
 */
export function AdminNav({ unreadDemandes = 0 }: { unreadDemandes?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigation back-office">
      {groups.map((group) => (
        <div className="bo-nav-group" key={group.title}>
          <p className="bo-nav-label">{group.title}</p>
          {group.items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = item.href === "/admin/demandes" ? unreadDemandes : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`bo-nav-link${active ? " is-active" : ""}`}
              >
                <span>{item.label}</span>
                {badge > 0 && <span className="bo-nav-badge">{badge > 99 ? "99+" : badge}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
