import type { Bi } from "./content";

const b = <T = string,>(fr: T, en: T): Bi<T> => ({ fr, en });

export type Hotspot = {
  id: string;
  chapter: string;
  /** Position dans le repère du diorama (X droite, Z sens de marche). */
  position: [number, number, number];
  title: Bi;
  kicker: Bi;
  lines: Bi<string[]>;
  links?: { label: string; href: string }[];
};

/** Fiches ouvertes en cliquant sur un objet dans une pièce. À valider/corriger par Indy. */
export const hotspots: Hotspot[] = [
  {
    id: "tennis-ball", chapter: "tennis", position: [-0.9, 0.35, 1.6],
    kicker: b("Tennis · 6 ans", "Tennis · 6 years"), title: b("La balle", "The ball"),
    lines: b(["Compétition en club pendant six ans, plusieurs entraînements par semaine.", "Ce que ça laisse : l'endurance, la précision, et l'habitude de rejouer le point suivant."], ["Six years of club competition, several sessions a week.", "What stays: stamina, precision, and the habit of playing the next point."]),
  },
  {
    id: "foot-ball", chapter: "foot", position: [-0.8, 0.45, 0.8],
    kicker: b("Football · 8 ans", "Football · 8 years"), title: b("Le ballon", "The ball"),
    lines: b(["Huit ans en club, aujourd'hui en loisir, plus le padel entre amis.", "Ce que ça laisse : jouer pour l'équipe, parler sur le terrain, accepter une décision."], ["Eight years in a club, now for fun, plus padel with friends.", "What stays: playing for the team, talking on the pitch, accepting a call."]),
  },
  {
    id: "lycee-board", chapter: "lycee", position: [-9.05, 1.55, 0.4],
    kicker: b("Lycée Simone Veil", "Lycée Simone Veil"), title: b("Bac maths-physique", "Maths & physics baccalaureate"),
    lines: b(["Spécialités mathématiques et physique-chimie.", "Le goût des modèles, des démonstrations propres et des résultats qu'on peut vérifier.", "Ensuite : une année de BUT GEA à l'IUT de Nice (gestion, comptabilité, droit)."], ["Mathematics and physics-chemistry majors.", "A taste for models, clean proofs and results you can check.", "Then: one year of BUT GEA at IUT Nice (management, accounting, law)."]),
  },
  {
    id: "concertae-pc", chapter: "concertae", position: [-4.4, 1.15, 1.2],
    kicker: b("Concertae · Cannes · 2025-2026", "Concertae · Cannes · 2025-2026"), title: b("Ce que le cabinet m'a appris", "What the firm taught me"),
    lines: b(["Outils : Cegid et Pennylane, au quotidien.", "Déclarations de TVA et respect des échéances.", "Bilans : de la révision des comptes à la clôture.", "Un bilan de fusion, du début à la fin.", "Relation client : expliquer, rassurer, relancer."], ["Tools: Cegid and Pennylane, daily.", "VAT returns and deadline discipline.", "Balance sheets: from account reviews to closing.", "One merger balance sheet, end to end.", "Client contact: explain, reassure, follow up."]),
  },
  {
    id: "concertae-shelf", chapter: "concertae", position: [-2.0, 1.6, 4.6],
    kicker: b("Compétences", "Skills"), title: b("Business", "Business"),
    lines: b(["Comptabilité générale sur Cegid et Pennylane (1 an en cabinet).", "TVA, bilans, bilan de fusion.", "Gestion de projet client, cadrage de devis, prospection B2B."], ["General accounting on Cegid and Pennylane (1 year in a firm).", "VAT, balance sheets, merger balance sheet.", "Client project management, quote scoping, B2B prospecting."]),
  },
  {
    id: "chambre-laptop", chapter: "indysigner", position: [-8.6, 1.35, -2.6],
    kicker: b("Indysigner · depuis avril 2026", "Indysigner · since April 2026"), title: b("Le studio", "The studio"),
    lines: b(["Sites sur mesure pour des TPE, livrés de bout en bout : design, code, mise en ligne, SEO.", "Stack : Next.js, TypeScript, Tailwind, GSAP, Three.js, Cloudflare Pages.", "Quatre sites en ligne pour de vrais clients."], ["Custom websites for small businesses, delivered end to end: design, code, launch, SEO.", "Stack: Next.js, TypeScript, Tailwind, GSAP, Three.js, Cloudflare Pages.", "Four live websites for real clients."]),
    links: [{ label: "indysigner.fr", href: "https://indysigner.fr" }],
  },
  {
    id: "chambre-cards", chapter: "indysigner", position: [-1.6, 2.5, 1.5],
    kicker: b("Projets", "Projects"), title: b("Quatre sites en ligne", "Four live websites"),
    lines: b(["L'Ovive : pizzeria, CMS pour que le gérant édite sa carte seul.", "Manika.LAB : distributeur B2B de cosmétique capillaire, 226 produits, compte pro.", "Nayuma Tea : boutique de thés headless Shopify, couche B2B et devis.", "Indysigner.fr : le site du studio, animé en 3D."], ["L'Ovive: pizzeria, CMS so the owner edits the menu alone.", "Manika.LAB: B2B hair-cosmetics distributor, 226 products, pro accounts.", "Nayuma Tea: headless Shopify tea shop, B2B layer and quotes.", "Indysigner.fr: the studio's own animated 3D site."]),
    links: [{ label: "lovive.fr", href: "https://lovive.fr" }, { label: "manikalab.com", href: "https://manikalab.com" }, { label: "nayumatea.com", href: "https://nayumatea.com" }],
  },
  {
    id: "chambre-poster", chapter: "indysigner", position: [-9.3, 2.35, -2.6],
    kicker: b("Data & automatisation", "Data & automation"), title: b("Prospection automatisée", "Automated prospecting"),
    lines: b(["Sourcing d'entreprises locales, mails rédigés avec l'IA, validation manuelle, envoi et suivi des réponses par n8n.", "Synchronisation et audit de catalogues Shopify, indexation de recherche au build, relances Klaviyo."], ["Local business sourcing, AI-drafted emails, manual validation, sending and reply tracking via n8n.", "Shopify catalogue sync and audits, build-time search indexing, Klaviyo flows."]),
  },
  {
    id: "albert-screen", chapter: "albert", position: [-4.2, 1.15, 1.4],
    kicker: b("Albert School × Mines Paris-PSL", "Albert School × Mines Paris-PSL"), title: b("Bachelor Business & Data", "Bachelor in Business & Data"),
    lines: b(["2026-2029, campus de Milan puis Paris.", "Stratégie, finance et marketing d'un côté ; mathématiques, statistiques, Python et SQL de l'autre.", "Projets en équipe avec des entreprises partenaires dès la première année."], ["2026-2029, Milan campus then Paris.", "Strategy, finance and marketing on one side; maths, statistics, Python and SQL on the other.", "Team projects with partner companies from year one."]),
  },
  {
    id: "albert-books", chapter: "albert", position: [-8.9, 1.7, -1.6],
    kicker: b("Et après", "Next"), title: b("Stage · été 2027", "Internship · summer 2027"),
    lines: b(["Disponible pour un stage d'environ 6 semaines à partir du 5 juin 2027.", "Business, data ou produit : un profil qui comprend les chiffres et sait livrer."], ["Available for a ~6-week internship from 5 June 2027.", "Business, data or product: a profile that understands numbers and knows how to ship."]),
    links: [{ label: "indyfrancois6@gmail.com", href: "mailto:indyfrancois6@gmail.com" }],
  },
];
