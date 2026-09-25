import { AlbumBrowser } from "@/components/gallery/album-browser";
import { GateForm } from "@/components/forms/auth-forms";
import { lockAlbumAction } from "@/server/actions";
import { getOpenAlbums } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function GaleriePage() {
  const albums = await getOpenAlbums();
  const year = new Date().getFullYear();

  return (
    <>
      <header className="nav">
        <a className="logo" href="/" aria-label="KYA Design — Accueil">
          <img src="/assets/brand/kya-design-logo.png" alt="KYA Designer" width={220} height={80} />
        </a>
        <nav className="nav-links">
          <a href="/">Retour au portfolio</a>
        </nav>
      </header>
      {!albums ? (
        <section className="gate" id="gate">
          <div className="gate-box">
            <p className="kicker">Espace client</p>
            <h1>Retrouvez vos souvenirs</h1>
            <p style={{ color: "var(--muted)" }}>
              Votre cérémonie, vos moments, vos photos. Entrez le code fourni par votre photographe.
            </p>
            <GateForm />
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="wrap">
            <div className="private-tools">
              <div>
                <p className="kicker">Accès actif</p>
                <h2>Votre album</h2>
              </div>
              <form action={lockAlbumAction}>
                <button className="btn" type="submit">Quitter</button>
              </form>
            </div>
            <AlbumBrowser albums={albums} />
          </div>
        </section>
      )}
      <footer>
        <span>© {year} Kya Design — accès restreint</span>
      </footer>
    </>
  );
}
