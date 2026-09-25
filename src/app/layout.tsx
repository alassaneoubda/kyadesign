import type { Metadata } from "next";
import "./globals.css";
import "./academy.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kya Design — Yohann Armel Koukoui",
    template: "%s · Kya Design",
  },
  description:
    "Portfolio de Yohann Armel Koukoui, designer graphique à Abidjan. Identité visuelle, publicité, print, contenu digital et photographie.",
  keywords: [
    "Kya Design",
    "Yohann Armel Koukoui",
    "graphiste Abidjan",
    "identité visuelle",
    "photographe",
    "formation design",
  ],
  authors: [{ name: "Yohann Armel Koukoui" }],
  openGraph: {
    type: "website",
    locale: "fr_CI",
    url: siteUrl,
    siteName: "Kya Design",
    title: "Kya Design — Yohann Armel Koukoui",
    description:
      "Identité visuelle, publicité, print, contenu digital et photographie. Portfolio & Academy.",
    images: [
      {
        url: "/assets/brand/kya-design-logo.png",
        width: 1200,
        height: 630,
        alt: "Kya Design",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kya Design — Yohann Armel Koukoui",
    description: "Designer graphique & photographe — Abidjan.",
    images: ["/assets/brand/kya-design-logo.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
