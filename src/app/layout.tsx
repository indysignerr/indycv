import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE } from "@/lib/content";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-serif", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const description =
  "Indy François — étudiant Mines Paris-PSL × Albert School (Bachelor Business & Data) et fondateur d'Indysigner. Business, data & code.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: "Indy François — Business, data & code",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE.url,
    siteName: "Indy François",
    title: "Indy François — Business, data & code",
    description,
    locale: "fr_FR",
    alternateLocale: ["en_US"],
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Indy François — Business, data & code" }],
  },
  twitter: { card: "summary_large_image", title: "Indy François — Business, data & code", description, images: ["/og.png"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = { themeColor: "#0B0B10", width: "device-width", initialScale: 1 };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: SITE.name,
  url: SITE.url,
  email: `mailto:${SITE.email}`,
  telephone: SITE.phoneHref,
  image: `${SITE.url}/images/indy-photo.jpg`,
  jobTitle: "Étudiant Business & Data, fondateur d'Indysigner",
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "Albert School" },
    { "@type": "CollegeOrUniversity", name: "Mines Paris-PSL" },
  ],
  worksFor: { "@type": "Organization", name: "Indysigner", url: "https://indysigner.fr" },
  knowsLanguage: ["fr", "en"],
  sameAs: [SITE.github, SITE.linkedin],
};

// Applique le thème avant le premier rendu (pas de flash)
const themeScript = `try{var t=localStorage.getItem("theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}try{if(new URLSearchParams(location.search).has("simple")||localStorage.getItem("view")==="simple"||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.view="simple"}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning className={`${display.variable} ${serif.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
