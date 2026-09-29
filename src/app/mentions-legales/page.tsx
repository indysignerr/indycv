import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Mentions légales — Indy François",
  alternates: { canonical: "/mentions-legales/" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LegalShell title="Mentions légales">
      <h2>Éditeur du site</h2>
      <p>
        Le site <strong>{SITE.url.replace("https://", "")}</strong> est édité à titre personnel par <strong>Indy François</strong>, Sophia Antipolis (France).
        Directeur de la publication : Indy François. Contact : <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.
      </p>
      <h2>Hébergement</h2>
      <p>Le site est hébergé par Cloudflare, Inc. (Cloudflare Pages), 101 Townsend St, San Francisco, CA 94107, États-Unis — cloudflare.com.</p>
      <h2>Propriété intellectuelle</h2>
      <p>Les textes, visuels, illustrations et éléments 3D de ce site sont la propriété d&apos;Indy François, sauf mention contraire. Toute reproduction sans autorisation écrite préalable est interdite. Les marques et sites cités (Indysigner, L&apos;Ovive, Manika.LAB, Nayuma Tea) appartiennent à leurs propriétaires respectifs.</p>
      <h2>Responsabilité</h2>
      <p>Les informations présentées ont un caractère informatif et sont mises à jour régulièrement, sans garantie d&apos;exhaustivité. Les liens vers des sites tiers n&apos;engagent pas la responsabilité de l&apos;éditeur.</p>
      <h2>Droit applicable</h2>
      <p>Le présent site est soumis au droit français. Tout litige relève des juridictions françaises compétentes.</p>
    </LegalShell>
  );
}
