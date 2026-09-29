import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";
import { SITE } from "@/lib/content";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Indy François",
  alternates: { canonical: "/politique-de-confidentialite/" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <LegalShell title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <p>Ce site ne comporte ni formulaire, ni compte, ni outil de mesure d&apos;audience, ni cookie publicitaire. Aucune donnée personnelle n&apos;y est collectée par l&apos;éditeur.</p>
      <h2>Stockage local</h2>
      <p>Votre navigateur conserve uniquement deux préférences d&apos;affichage, sur votre appareil (localStorage) : la langue et le thème clair/sombre. Elles ne sont jamais transmises et ne nécessitent pas de consentement.</p>
      <h2>Hébergement</h2>
      <p>Le site est servi par Cloudflare, qui peut traiter votre adresse IP à des fins techniques et de sécurité (journaux serveur).</p>
      <h2>Me contacter</h2>
      <p>Si vous m&apos;écrivez à <a href={`mailto:${SITE.email}`}>{SITE.email}</a>, j&apos;utilise votre adresse et votre message uniquement pour vous répondre, et je ne les transmets à personne.</p>
      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement et d&apos;opposition. Écrivez-moi à l&apos;adresse ci-dessus. En cas de désaccord, vous pouvez saisir la CNIL (cnil.fr).</p>
    </LegalShell>
  );
}
