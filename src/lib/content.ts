export type Lang = "fr" | "en";

export const SITE = {
  name: "Indy François",
  url: "https://indyfrancois.com",
  email: "indyfrancois6@gmail.com",
  phone: "07 69 76 20 76",
  phoneHref: "+33769762076",
  github: "https://github.com/indysignerr",
  linkedin: "https://www.linkedin.com/in/indy-françois-37a451284",
};

export type Bi<T = string> = { fr: T; en: T };
const b = <T = string>(fr: T, en: T): Bi<T> => ({ fr, en });

export const ui = {
  nav: {
    about: b("Parcours", "Journey"),
    projects: b("Projets", "Projects"),
    skills: b("Compétences", "Skills"),
    hobbies: b("Loisirs", "Beyond work"),
    contact: b("Contact", "Contact"),
  },
  hero: {
    eyebrow: b("Mines Paris-PSL × Albert School", "Mines Paris-PSL × Albert School"),
    line1: b("Business, data & code.", "Business, data & code."),
    intro: b(
      "Étudiant en Bachelor Business & Data et fondateur d'Indysigner, je conçois et livre des sites qui vendent, avec l'œil du gestionnaire et la main du développeur.",
      "Business & Data undergraduate and founder of Indysigner. I design and ship websites that sell, with a manager's eye and a developer's hands."
    ),
    availability: b(
      "Disponible pour un stage d'environ 6 semaines dès le 5 juin 2027",
      "Available for a ~6-week internship from 5 June 2027"
    ),
    cta: b("M'écrire", "Get in touch"),
    cv: b("Télécharger mon CV", "Download my CV"),
    scroll: b("Défiler", "Scroll"),
  },
  about: {
    label: b("01 — Parcours", "01 — Journey"),
    title: b("D'où je viens, où je vais.", "Where I come from, where I'm heading."),
  },
  projects: {
    label: b("02 — Projets", "02 — Projects"),
    title: b("Ce que j'ai construit.", "What I've built."),
    visit: b("Voir le site", "Visit site"),
  },
  skills: {
    label: b("03 — Compétences", "03 — Skills"),
    title: b("Trois métiers, une seule tête.", "Three trades, one head."),
    languages: b("Langues", "Languages"),
  },
  hobbies: {
    label: b("04 — Loisirs", "04 — Beyond work"),
    title: b("Hors écran.", "Off screen."),
  },
  contact: {
    label: b("05 — Contact", "05 — Contact"),
    title: b("Travaillons ensemble.", "Let's work together."),
    text: b(
      "Un stage, une mission, une question : écrivez-moi, je réponds vite.",
      "An internship, a project, a question: write to me, I reply fast."
    ),
    mail: b("indyfrancois6@gmail.com", "indyfrancois6@gmail.com"),
  },
  footer: {
    legal: b("Mentions légales", "Legal notice"),
    privacy: b("Confidentialité", "Privacy"),
    rights: b("Fait main à Sophia Antipolis.", "Handmade in Sophia Antipolis."),
  },
  theme: { toDark: b("Passer en mode sombre", "Switch to dark mode"), toLight: b("Passer en mode clair", "Switch to light mode") },
  langSwitch: b("Switch to English", "Passer en français"),
  sound: { on: b("Activer le son", "Turn sound on"), off: b("Couper le son", "Turn sound off"), hint: b("Avec le son", "With sound") },
  view: { simple: b("Version simple, sans 3D", "Simple version, no 3D"), full: b("Version 3D", "3D version") },
  skip: b("Aller au contenu", "Skip to content"),
};

export const stats = [
  { value: 4, label: b("sites en ligne", "live websites") },
  { value: 6, label: b("ans de tennis", "years of tennis") },
  { value: 8, label: b("ans de foot", "years of football") },
  { value: 1, label: b("an en cabinet comptable", "year in accounting") },
];

export const timeline = [
  {
    period: b("2026 — 2029", "2026 — 2029"),
    title: b("Albert School × Mines Paris-PSL", "Albert School × Mines Paris-PSL"),
    sub: b("Bachelor Business & Data", "Bachelor in Business & Data"),
    text: b(
      "Data, IA et maths d'un côté, finance, marketing et stratégie de l'autre. Trois campus : Milan, Paris, puis Madrid. Diplôme conjoint avec Mines Paris-PSL.",
      "Data, AI and maths on one side, finance, marketing and strategy on the other. Three campuses: Milan, Paris, then Madrid. Joint degree with Mines Paris-PSL."
    ),
  },
  {
    period: b("Avril 2026 →", "April 2026 →"),
    title: b("Fondateur d'Indysigner", "Founder of Indysigner"),
    sub: b("Studio web indépendant · Sophia Antipolis", "Independent web studio · Sophia Antipolis"),
    text: b(
      "Sites sur mesure pour TPE, prospection automatisée, livraison de bout en bout : design, code, mise en ligne, SEO.",
      "Custom websites for small businesses, automated prospecting, end-to-end delivery: design, code, launch, SEO."
    ),
  },
  {
    period: b("Sept. 2025 — Sept. 2026", "Sept 2025 — Sept 2026"),
    title: b("Concertae", "Concertae"),
    sub: b("Alternance en comptabilité · Cannes", "Accounting apprenticeship · Cannes"),
    text: b(
      "Un an en cabinet : saisie et révision sur Cegid et Pennylane, TVA, bilans et même un bilan de fusion. Rigueur des échéances, contact client.",
      "One year in an accounting firm: bookkeeping and reviews on Cegid and Pennylane, VAT, balance sheets and even a merger balance sheet. Deadline discipline, client contact."
    ),
  },
  {
    period: b("Avant", "Before"),
    title: b("BUT GEA · IUT de Nice", "BUT GEA · IUT Nice"),
    sub: b("Gestion des entreprises et des administrations", "Business & administration management"),
    text: b("Une année de socle en gestion, comptabilité et droit.", "A foundation year in management, accounting and law."),
  },
  {
    period: b("Avant", "Before"),
    title: b("Baccalauréat mathématiques-physique", "Baccalauréat, maths & physics"),
    sub: b("Lycée Simone Veil", "Lycée Simone Veil"),
    text: b("Le goût des modèles et de la méthode.", "A taste for models and method."),
  },
];

export const projects = [
  {
    name: "Indysigner",
    kind: b("Studio web · 2026", "Web studio · 2026"),
    text: b(
      "Mon studio : site vitrine animé (Next.js, GSAP, 3D), blog, portfolio, et un système de prospection automatisé (sourcing, mails rédigés avec l'IA, validation manuelle, envoi et suivi par n8n).",
      "My studio: an animated showcase site (Next.js, GSAP, 3D), blog, portfolio, and an automated prospecting system (sourcing, AI-drafted emails, manual validation, sending and follow-up via n8n)."
    ),
    tags: ["Next.js", "GSAP", "React Three Fiber", "n8n"],
    links: [{ label: "indysigner.fr", href: "https://indysigner.fr" }],
  },
  {
    name: "L'Ovive",
    kind: b("Restaurant · 2026", "Restaurant · 2026"),
    text: b(
      "Site de pizzeria sur Cloudflare Pages. Le gérant modifie carte et prix seul via un CMS, sans passer par moi. SEO local et pages légales inclus.",
      "Pizzeria website on Cloudflare Pages. The owner edits menu and prices alone through a CMS. Local SEO and legal pages included."
    ),
    tags: ["Next.js", "Decap CMS", "Cloudflare Pages", "SEO local"],
    links: [{ label: "lovive.fr", href: "https://lovive.fr" }],
  },
  {
    name: "Manika.LAB × Nayuma Tea",
    kind: b("E-commerce · 2026", "E-commerce · 2026"),
    text: b(
      "Deux boutiques headless sur Shopify : un distributeur de cosmétique capillaire B2B (226 produits, 10 marques, nuancier filtrable, compte pro) et une boutique de thés avec couche B2B et devis.",
      "Two headless Shopify stores: a B2B hair-cosmetics distributor (226 products, 10 brands, filterable shade chart, pro accounts) and a tea shop with a B2B layer and quotes."
    ),
    tags: ["Shopify API", "Next.js", "Klaviyo", "Cloudflare"],
    links: [
      { label: "manikalab.com", href: "https://manikalab.com" },
      { label: "nayumatea.com", href: "https://nayumatea.com" },
    ],
  },
];

export const skills = [
  {
    key: "business",
    title: b("Business", "Business"),
    items: b(
      ["Comptabilité (1 an en cabinet)", "Gestion de projet client", "Prospection B2B", "Cadrage & devis"],
      ["Accounting (1 year in a firm)", "Client project management", "B2B prospecting", "Scoping & quotes"]
    ),
  },
  {
    key: "data",
    title: b("Data", "Data"),
    items: b(
      ["Automatisation n8n", "Synchronisation & audit Shopify", "Indexation de catalogue", "Suivi et relances Klaviyo"],
      ["n8n automation", "Shopify sync & audit", "Catalogue indexing", "Klaviyo flows"]
    ),
  },
  {
    key: "code",
    title: b("Code", "Code"),
    items: b(
      ["Next.js · TypeScript · Tailwind", "GSAP · Framer Motion · Lenis", "Three.js · React Three Fiber", "Cloudflare Pages · GitHub"],
      ["Next.js · TypeScript · Tailwind", "GSAP · Framer Motion · Lenis", "Three.js · React Three Fiber", "Cloudflare Pages · GitHub"]
    ),
  },
];

export const languages = [
  { name: b("Français", "French"), level: b("Courant", "Fluent") },
  { name: b("Anglais", "English"), level: b("Bon niveau", "Good level") },
];

export const hobbies = [
  { name: b("Tennis", "Tennis"), text: b("6 ans, plusieurs fois par semaine.", "6 years, several times a week.") },
  { name: b("Padel", "Padel"), text: b("Le tennis, en plus social.", "Tennis, but more social.") },
  { name: b("Football", "Football"), text: b("8 ans de club, aujourd'hui en loisir.", "8 years in a club, now for fun.") },
  { name: b("Concerts", "Live music"), text: b("Rien ne bat un live.", "Nothing beats a live show.") },
];

export const tr = <T,>(v: Bi<T>, lang: Lang): T => v[lang];
