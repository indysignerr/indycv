import type { Lang } from "./content";

/**
 * Contenu du CV imprimable (A4, /cv/ → PDF). Rédigé pour être lu en 30 secondes par un recruteur :
 * expériences marquantes détaillées en puces courtes, chiffres concrets, jamais de tarifs ni de montants clients.
 */

type Entry = { title: string; org: string; period: string; bullets: string[] };
export type Cv = {
  role: string;
  availability: string;
  labels: { contact: string; profile: string; languages: string; skills: string; interests: string; experience: string; project: string; education: string };
  profile: string;
  languages: { name: string; level: string; value: number }[];
  skills: string[];
  interests: string[];
  experience: Entry[];
  project: Entry;
  education: Entry[];
};

const fr: Cv = {
  role: "Étudiant Business & Data · Fondateur d'Indysigner",
  availability: "Stage d'environ 6 semaines · dès le 5 juin 2027",
  labels: { contact: "Contact", profile: "Profil", languages: "Langues", skills: "Compétences", interests: "Centres d'intérêt", experience: "Expériences professionnelles", project: "Projet personnel", education: "Formation" },
  profile:
    "Étudiant en Bachelor Business & Data à Albert School × Mines Paris-PSL et fondateur d'Indysigner, studio web. Un an d'alternance en cabinet comptable et trois sites clients en ligne : je relie la lecture des chiffres, la data et le code.",
  languages: [
    { name: "Français", level: "Courant", value: 1 },
    { name: "Anglais", level: "Bon niveau", value: 0.72 },
  ],
  skills: [
    "Comptabilité · Cegid, Pennylane",
    "Gestion de projet client",
    "Prospection B2B automatisée (n8n)",
    "Next.js · TypeScript · Tailwind",
    "3D web · Three.js",
    "E-commerce headless · Shopify",
    "Cloudflare · GitHub",
  ],
  interests: ["Tennis · 6 ans", "Football · 8 ans en club", "Padel", "Concerts"],
  experience: [
    {
      title: "Fondateur · Studio web",
      org: "Indysigner, Sophia Antipolis",
      period: "Avril 2026 – aujourd'hui",
      bullets: [
        "Création d'un studio web indépendant : sites sur mesure pour TPE, du cadrage à la mise en ligne (design, code, SEO).",
        "3 sites clients en ligne : L'Ovive (restaurant, carte modifiable par le gérant), Manika.LAB (e-commerce B2B, 226 produits, 10 marques), Nayuma Tea (boutique de thés avec espace pro).",
        "Système de prospection automatisé : sourcing, e-mails rédigés avec l'IA et validés à la main, envoi et suivi par n8n.",
        "Relation client de bout en bout : cadrage, devis, livraison et prise en main par le client.",
      ],
    },
    {
      title: "Alternant en comptabilité",
      org: "Concertae, cabinet comptable · Cannes",
      period: "Sept. 2025 – Sept. 2026",
      bullets: [
        "Saisie et révision comptable sur Cegid et Pennylane.",
        "Déclarations de TVA, préparation des bilans et participation à un bilan de fusion.",
        "Tenue des échéances fiscales et contact direct avec les clients du cabinet.",
      ],
    },
  ],
  project: {
    title: "CV interactif en 3D",
    org: "indyfrancois.com",
    period: "2026",
    bullets: [
      "Mon parcours raconté en 3D : on fait défiler l'histoire, un personnage traverse les lieux qui m'ont formé ; points cliquables, version FR/EN.",
      "Pensé pour tourner partout : préparation en arrière-plan, modèle 3D allégé de 60 %, version simplifiée automatique sur les appareils modestes.",
      "Next.js · Three.js / React Three Fiber · Blender · Cloudflare Pages",
    ],
  },
  education: [
    {
      title: "Bachelor Business & Data",
      org: "Albert School × Mines Paris-PSL",
      period: "2026 – 2029",
      bullets: ["Data, IA et mathématiques ; finance, marketing et stratégie. Trois campus : Milan, Paris puis Madrid. Diplôme conjoint avec Mines Paris-PSL."],
    },
    { title: "BUT Gestion des entreprises et des administrations (1re année)", org: "IUT de Nice", period: "2024 – 2025", bullets: [] },
    { title: "Baccalauréat général · mathématiques et physique", org: "Lycée Simone Veil", period: "2024", bullets: [] },
  ],
};

const en: Cv = {
  role: "Business & Data student · Founder of Indysigner",
  availability: "~6-week internship · from 5 June 2027",
  labels: { contact: "Contact", profile: "Profile", languages: "Languages", skills: "Skills", interests: "Interests", experience: "Work experience", project: "Personal project", education: "Education" },
  profile:
    "Business & Data undergraduate at Albert School × Mines Paris-PSL and founder of Indysigner, a web studio. One year of work-study in an accounting firm and three client websites live: I connect reading the numbers, data and code.",
  languages: [
    { name: "French", level: "Fluent", value: 1 },
    { name: "English", level: "Good level", value: 0.72 },
  ],
  skills: [
    "Accounting · Cegid, Pennylane",
    "Client project management",
    "Automated B2B prospecting (n8n)",
    "Next.js · TypeScript · Tailwind",
    "3D web · Three.js",
    "Headless e-commerce · Shopify",
    "Cloudflare · GitHub",
  ],
  interests: ["Tennis · 6 years", "Football · 8 years in a club", "Padel", "Live music"],
  experience: [
    {
      title: "Founder · Web studio",
      org: "Indysigner, Sophia Antipolis",
      period: "April 2026 – present",
      bullets: [
        "Started an independent web studio: custom websites for small businesses, from scoping to launch (design, code, SEO).",
        "3 client websites live: L'Ovive (restaurant, menu editable by the owner), Manika.LAB (B2B e-commerce, 226 products, 10 brands), Nayuma Tea (tea shop with a pro area).",
        "Automated prospecting system: sourcing, AI-drafted emails validated by hand, sending and follow-up with n8n.",
        "End-to-end client relationship: scoping, quotes, delivery and client onboarding.",
      ],
    },
    {
      title: "Accounting apprentice",
      org: "Concertae, accounting firm · Cannes",
      period: "Sept 2025 – Sept 2026",
      bullets: [
        "Bookkeeping and account reviews on Cegid and Pennylane.",
        "VAT returns, year-end financial statements and a merger balance sheet.",
        "Tax deadlines and direct contact with the firm's clients.",
      ],
    },
  ],
  project: {
    title: "Interactive 3D CV",
    org: "indyfrancois.com",
    period: "2026",
    bullets: [
      "My journey as a 3D story: you scroll and a character walks through the places that shaped me; clickable points, FR/EN.",
      "Built to run everywhere: loading behind the intro, 3D model 60% lighter, automatic simple version on modest devices.",
      "Next.js · Three.js / React Three Fiber · Blender · Cloudflare Pages",
    ],
  },
  education: [
    {
      title: "Bachelor in Business & Data",
      org: "Albert School × Mines Paris-PSL",
      period: "2026 – 2029",
      bullets: ["Data, AI and maths; finance, marketing and strategy. Three campuses: Milan, Paris, then Madrid. Joint degree with Mines Paris-PSL."],
    },
    { title: "BUT in Business & Administration (1st year)", org: "IUT Nice", period: "2024 – 2025", bullets: [] },
    { title: "French Baccalauréat · maths and physics", org: "Lycée Simone Veil", period: "2024", bullets: [] },
  ],
};

export const cv: Record<Lang, Cv> = { fr, en };
