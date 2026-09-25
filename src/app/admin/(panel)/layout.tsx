import { logoutAction } from "@/server/actions";
import { getAdminSession } from "@/lib/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import "../admin.css";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const unreadDemandes = await prisma.contactRequest.count({ where: { read: false } });

  return (
    <div className="bo">
      <aside className="bo-side">
        <div className="bo-brand">
          <a href="/">
            <img src="/assets/brand/kya-design-logo.png" alt="KYA Design" width={160} height={48} />
          </a>
          <span>Back-office</span>
        </div>
        <AdminNav unreadDemandes={unreadDemandes} />
        <div className="bo-side-foot">
          <a className="btn btn-ghost" href="/" target="_blank" rel="noopener noreferrer">
            Voir le site
          </a>
          <form action={logoutAction}>
            <button className="btn" type="submit">
              Quitter
            </button>
          </form>
        </div>
      </aside>
      <main className="bo-main">{children}</main>
    </div>
  );
}
