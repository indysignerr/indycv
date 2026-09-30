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

/** Fiches ouvertes en cliquant sur un objet dans une pièce. */
export const hotspots: Hotspot[] = [
  {
    id: "tennis-ball", chapter: "tennis", position: [-1.2, 1.35, -2.6],
    kicker: b("Tennis · 6 ans", "Tennis · 6 years"), title: b("La balle", "The ball"),
    lines: b(["Compétition en club pendant six ans, plusieurs entraînements par semaine.", "Ce que ça laisse : l'endurance, la précision, et l'habitude de rejouer le point suivant."], ["Six years of club competition, several sessions a week.", "What stays: stamina, precision, and the habit of playing the next point."]),
  },
  {
    id: "foot-ball", chapter: "foot", position: [-1.4, 0.6, 0.9],
    kicker: b("Football · 8 ans", "Football · 8 years"), title: b("Le ballon", "The ball"),
    lines: b(["Huit ans en club, aujourd'hui en loisir, plus le padel entre amis.", "Ce que ça laisse : jouer pour l'équipe, parler sur le terrain, accepter une décision."], ["Eight years in a club, now for fun, plus padel with friends.", "What stays: playing for the team, talking on the pitch, accepting a call."]),
  },
  {
    id: "lycee-board", chapter: "lycee", position: [-9.3, 1.6, 0],
    kicker: b("Lycée Simone Veil", "Lycée Simone Veil"), title: b("Bac maths-physique", "Maths & physics baccalaureate"),
    lines: b(["Spécialités mathématiques et physique-chimie.", "Le goût des modèles, des démonstrations propres et des résultats qu'on peut vérifier.", "Ensuite : une année de BUT GEA à l'IUT de Nice (gestion, comptabilité, droit), 3e de la promotion."], ["Mathematics and physics-chemistry majors.", "A taste for models, clean proofs and results you can check.", "Then: one year of BUT GEA at IUT Nice (management, accounting, law), ranked 3rd in my class."]),
  },
  {
    id: "lycee-erasmus", chapter: "lycee", position: [-8.15, 1.42, 2.1],
    kicker: b("Lycée Simone Veil · Section européenne", "Lycée Simone Veil · European section"), title: b("Échange Erasmus en Norvège", "Erasmus exchange in Norway"),
    lines: b(["Bac en section européenne : plus d'heures de langue et une matière enseignée en langue étrangère.", "Un échange Erasmus en Norvège : vivre et étudier dans une autre langue, dans un autre système scolaire.", "L'international, déjà : aujourd'hui, mon bachelor se fait sur trois campus, Milan, Paris puis Madrid."], ["Baccalaureate in the European section: extra language hours and a subject taught in a foreign language.", "An Erasmus exchange in Norway: living and studying in another language, in another school system.", "International from the start: today my bachelor runs across three campuses, Milan, Paris, then Madrid."]),
  },
  {
    id: "concertae-pc", chapter: "concertae", position: [-3.8, 1.55, 1.6],
    kicker: b("Concertae · Cannes · 2025-2026", "Concertae · Cannes · 2025-2026"), title: b("Mon poste en alternance", "My apprenticeship desk"),
    lines: b(["Saisie et révision des comptes, au quotidien sur Cegid et Pennylane.", "Déclarations de TVA, dans les délais.", "Préparation des bilans, jusqu'à la clôture.", "Et même un bilan de fusion."], ["Bookkeeping and account reviews, daily on Cegid and Pennylane.", "VAT returns, on time.", "Preparing balance sheets, through to closing.", "And even a merger balance sheet."]),
  },
  {
    id: "concertae-shelf", chapter: "concertae", position: [-6.6, 1.3, 4.2],
    kicker: b("Ce qui reste", "What stays"), title: b("Lire une entreprise par ses chiffres", "Reading a company through its numbers"),
    lines: b(["Un bilan et un compte de résultat racontent une histoire : j'ai appris à la lire.", "Rigueur, confidentialité, échéances : on ne rend pas un bilan à peu près.", "Relation client : expliquer, rassurer, relancer."], ["A balance sheet and an income statement tell a story: I learned to read it.", "Rigour, confidentiality, deadlines: you don't hand in an approximate balance sheet.", "Client contact: explain, reassure, follow up."]),
  },
  {
    id: "chambre-laptop", chapter: "indysigner", position: [-8.9, 1.6, -2.2],
    kicker: b("Indysigner · depuis avril 2026", "Indysigner · since April 2026"), title: b("Le studio", "The studio"),
    lines: b(["Sites sur mesure pour des TPE, livrés de bout en bout : design, code, mise en ligne, SEO.", "Stack : Next.js, TypeScript, Tailwind, GSAP, Three.js, Cloudflare Pages.", "Trois sites clients en ligne, plus celui du studio."], ["Custom websites for small businesses, delivered end to end: design, code, launch, SEO.", "Stack: Next.js, TypeScript, Tailwind, GSAP, Three.js, Cloudflare Pages.", "Three client websites live, plus the studio's own."]),
    links: [{ label: "indysigner.fr", href: "https://indysigner.fr" }],
  },
  {
    id: "chambre-cards", chapter: "indysigner", position: [-8.9, 1.4, 1.4],
    kicker: b("Projets", "Projects"), title: b("Quatre sites en ligne", "Four live websites"),
    lines: b(["L'Ovive : pizzeria, CMS pour que le gérant édite sa carte seul.", "Manika.LAB : distributeur B2B de cosmétique capillaire, 226 produits, compte pro.", "Nayuma Tea : boutique de thés headless Shopify, couche B2B et devis.", "Indysigner.fr : le site du studio, animé en 3D."], ["L'Ovive: pizzeria, CMS so the owner edits the menu alone.", "Manika.LAB: B2B hair-cosmetics distributor, 226 products, pro accounts.", "Nayuma Tea: headless Shopify tea shop, B2B layer and quotes.", "Indysigner.fr: the studio's own animated 3D site."]),
    links: [{ label: "lovive.fr", href: "https://lovive.fr" }, { label: "manikalab.com", href: "https://manikalab.com" }, { label: "nayumatea.com", href: "https://nayumatea.com" }],
  },
  {
    id: "chambre-pipeline", chapter: "indysigner", position: [-9.2, 2.14, -0.1],
    kicker: b("Data & automatisation", "Data & automation"), title: b("Prospection automatisée", "Automated prospecting"),
    lines: b(["Sourcing d'entreprises locales, e-mails rédigés avec l'IA, validation manuelle, puis envoi et suivi des réponses par n8n.", "Côté boutiques : synchronisation et audit des catalogues Shopify, recherche indexée au build, relances Klaviyo."], ["Local business sourcing, AI-drafted emails, manual validation, then sending and reply tracking via n8n.", "For the shops: Shopify catalogue sync and audits, build-time search indexing, Klaviyo flows."]),
  },
  {
    id: "albert-screen", chapter: "albert", position: [-9.2, 1.7, 1.3],
    kicker: b("Albert School × Mines Paris-PSL", "Albert School × Mines Paris-PSL"), title: b("Bachelor Business & Data", "Bachelor in Business & Data"),
    lines: b(["2026-2029 : trois ans, trois campus. Milan, Paris, puis Madrid.", "Data, IA et maths (statistiques, Python, SQL, machine learning) d'un côté ; finance, comptabilité, marketing et stratégie de l'autre.", "Des missions de conseil en équipe pour de vraies entreprises, chaque année (Business Deep Dives).", "Un diplôme conjoint avec Mines Paris-PSL."], ["2026-2029: three years, three campuses. Milan, Paris, then Madrid.", "Data, AI and maths (statistics, Python, SQL, machine learning) on one side; finance, accounting, marketing and strategy on the other.", "Team consulting missions for real companies, every year (Business Deep Dives).", "A joint degree with Mines Paris-PSL."]),
  },
  {
    id: "albert-books", chapter: "albert", position: [-4.2, 1.5, 4.6],
    kicker: b("Et après", "Next"), title: b("Stage · été 2027", "Internship · summer 2027"),
    lines: b(["Disponible pour un stage d'environ 6 semaines à partir du 5 juin 2027.", "Business, data ou produit : un profil qui comprend les chiffres et sait livrer."], ["Available for a ~6-week internship from 5 June 2027.", "Business, data or product: a profile that understands numbers and knows how to ship."]),
    links: [{ label: "indyfrancois6@gmail.com", href: "mailto:indyfrancois6@gmail.com" }],
  },
];
