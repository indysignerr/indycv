import type { Bi, Lang } from "./content";

export type Clip = "idle" | "walk" | "tennis-forehand" | "soccer-kick" | "celebrate" | "handshake" | "look-around" | "dance" | "typing" | "sit-idle" | "open-door" | "write-board" | "walk-turn-left" | "walk-turn-right";

/** Palette d'un chapitre : accent + couleurs du diorama. */
export type Palette = { accent: string; panel: string; ink: string; floor: string; wall: string; sky: string; fog: string };

export type Chapter = {
  id: string;
  /** Distance (m) le long du chemin où commence le diorama. */
  at: number;
  length: number;
  clip: Clip;
  day: Palette;
  sunset: Palette;
  label: Bi;
  title: Bi;
  quality: Bi;
  text: Bi;
  links?: { label: string; href: string }[];
};

const b = (fr: string, en: string): Bi => ({ fr, en });

export const PATH_LENGTH = 100;

/** Un chapitre = une expérience = un diorama sur l'île. */
export const chapters: Chapter[] = [
  {
    id: "tennis", at: 8, length: 10, clip: "idle",
    day:    { accent: "#D6E23A", panel: "rgba(23,52,40,0.78)", ink: "#F3F7EA", floor: "#C2673B", wall: "#E8DED2", sky: "#BFE3F5", fog: "#DDF0F8" },
    sunset: { accent: "#F0F05A", panel: "rgba(30,26,40,0.82)", ink: "#F3F7EA", floor: "#9E4F2C", wall: "#B9AE9E", sky: "#F2A26B", fog: "#F6C79A" },
    label: b("Chapitre 1 · Enfance", "Chapter 1 · Childhood"),
    title: b("Le court de tennis", "The tennis court"),
    quality: b("Endurance & précision", "Stamina & precision"),
    text: b("Six ans de compétition, plusieurs entraînements par semaine. On y apprend à perdre un point et à rejouer le suivant sans trembler.", "Six years of competition, several sessions a week. You learn to lose a point and play the next one without flinching."),
  },
  {
    id: "foot", at: 26, length: 10, clip: "idle",
    day:    { accent: "#5FE08A", panel: "rgba(20,44,30,0.78)", ink: "#EEFBF2", floor: "#4CA455", wall: "#F1F3EE", sky: "#C4E6F7", fog: "#E0F1F9" },
    sunset: { accent: "#8CF5A8", panel: "rgba(24,26,34,0.82)", ink: "#EEFBF2", floor: "#3E8546", wall: "#B9B2A8", sky: "#F09E6A", fog: "#F5C69E" },
    label: b("Chapitre 2 · Le collectif", "Chapter 2 · Team"),
    title: b("Le terrain de foot", "The football pitch"),
    quality: b("Esprit d'équipe", "Team spirit"),
    text: b("Huit ans en club. Le foot, c'est apprendre à jouer pour les autres, à parler sur le terrain, à accepter la décision du coach.", "Eight years in a club. Football is learning to play for others, to talk on the pitch, to accept the coach's call."),
  },
  {
    id: "lycee", at: 44, length: 9, clip: "idle",
    day:    { accent: "#F5B942", panel: "rgba(40,34,26,0.8)", ink: "#FFF7E6", floor: "#B9B7B2", wall: "#F6F4EF", sky: "#CFE3F2", fog: "#E4EFF6" },
    sunset: { accent: "#FFC85C", panel: "rgba(30,24,22,0.84)", ink: "#FFF7E6", floor: "#8E8B85", wall: "#CFC9C0", sky: "#EE9C6C", fog: "#F3C4A0" },
    label: b("Chapitre 3 · Le lycée", "Chapter 3 · High school"),
    title: b("Maths & physique", "Maths & physics"),
    quality: b("Méthode & rigueur", "Method & rigour"),
    text: b("Bac maths-physique au lycée Simone Veil. Le goût des modèles, des démonstrations propres et des résultats vérifiables.", "Maths & physics baccalaureate at Lycée Simone Veil. A taste for models, clean proofs and verifiable results."),
  },
  {
    id: "concertae", at: 60, length: 9, clip: "idle",
    day:    { accent: "#4D86FF", panel: "rgba(24,30,46,0.8)", ink: "#EEF3FF", floor: "#C9A57A", wall: "#F2EFE8", sky: "#CFE0F2", fog: "#E3EDF6" },
    sunset: { accent: "#8FB0FF", panel: "rgba(18,20,32,0.84)", ink: "#EEF3FF", floor: "#9A7A56", wall: "#C4BDB0", sky: "#EA986C", fog: "#F1C2A0" },
    label: b("Chapitre 4 · Concertae", "Chapter 4 · Concertae"),
    title: b("Le cabinet comptable", "The accounting firm"),
    quality: b("Fiabilité & échéances", "Reliability & deadlines"),
    text: b("Un an d'alternance à Cannes (2025-2026) : Cegid, Pennylane, TVA, bilans et même un bilan de fusion. On ne rend pas un bilan à peu près.", "One year of apprenticeship in Cannes (2025-2026): Cegid, Pennylane, VAT, balance sheets and even a merger balance sheet. You don't hand in an approximate balance sheet."),
  },
  {
    id: "indysigner", at: 76, length: 10, clip: "idle",
    day:    { accent: "#C8694F", panel: "rgba(19,41,75,0.86)", ink: "#F5F1EA", floor: "#D9BE94", wall: "#F4F1EA", sky: "#D8D3E6", fog: "#E7E3EF" },
    sunset: { accent: "#E08A6E", panel: "rgba(14,24,46,0.88)", ink: "#F5F1EA", floor: "#A88E6A", wall: "#C9C2B6", sky: "#D98A6E", fog: "#E9B49A" },
    label: b("Chapitre 5 · Indysigner", "Chapter 5 · Indysigner"),
    title: b("L'atelier", "The studio"),
    quality: b("Autonomie & livraison", "Autonomy & delivery"),
    text: b("Depuis avril 2026, mon studio web. Quatre sites en ligne pour de vrais clients : design, code, mise en ligne, SEO, et un système de prospection automatisé.", "Since April 2026, my web studio. Four live websites for real clients: design, code, launch, SEO, plus an automated prospecting system."),
    links: [
      { label: "indysigner.fr", href: "https://indysigner.fr" },
      { label: "lovive.fr", href: "https://lovive.fr" },
      { label: "manikalab.com", href: "https://manikalab.com" },
      { label: "nayumatea.com", href: "https://nayumatea.com" },
    ],
  },
  {
    id: "albert", at: 90, length: 8, clip: "idle",
    day:    { accent: "#2A4BD7", panel: "rgba(22,26,50,0.8)", ink: "#F2F4FF", floor: "#B9B7B2", wall: "#F6F4EF", sky: "#CADFF5", fog: "#E1ECF8" },
    sunset: { accent: "#9DB0FF", panel: "rgba(14,16,32,0.86)", ink: "#F2F4FF", floor: "#8E8B85", wall: "#CFC9C0", sky: "#E6926B", fog: "#EFBE9F" },
    label: b("Chapitre 6 · Aujourd'hui", "Chapter 6 · Today"),
    title: b("Albert School × Mines Paris-PSL", "Albert School × Mines Paris-PSL"),
    quality: b("Business, data & code", "Business, data & code"),
    text: b("Bachelor Business & Data (2026-2029). La suite de l'histoire s'écrit ici. Disponible pour un stage d'environ 6 semaines dès le 5 juin 2027.", "Bachelor in Business & Data (2026-2029). The next chapter is written here. Available for a ~6-week internship from 5 June 2027."),
    links: [{ label: "indyfrancois6@gmail.com", href: "mailto:indyfrancois6@gmail.com" }],
  },
];

/** Palette « extérieur » entre deux chapitres. */
export const outside = {
  day:    { sky: "#BFDDF3", fog: "#DCEBF6", ground: "#8CBF6E", path: "#E7D9B8", accent: "#FF5A36" },
  sunset: { sky: "#F2A06A", fog: "#F5C69C", ground: "#6F9A5C", path: "#D9BFA0", accent: "#FF6B47" },
};

export const storyUi = {
  introKicker: b("Une histoire animée", "An animated story"),
  introTitle: b("Vous allez découvrir, au fil d'une histoire animée, la vie et les expériences d'Indy François.", "You're about to discover, through an animated story, the life and experiences of Indy François."),
  introHint: b("Faites défiler pour avancer. Chaque pièce ouvre une expérience.", "Scroll to move forward. Each room opens an experience."),
  start: b("Commencer l'histoire", "Start the story"),
  cv: b("Télécharger le CV", "Download the CV"),
  scrollHint: b("Défilez pour commencer", "Scroll to begin"),
  loading: b("Chargement du monde…", "Loading the world…"),
  end: b("Fin de l'histoire. Écrivons la suite ensemble.", "End of the story. Let's write the next one together."),
  endKicker: b("Merci d'être arrivé jusqu'ici", "Thanks for making it this far"),
  endTitle: b("La suite s'écrit avec vous : un stage d'environ 6 semaines à partir du 5 juin 2027.", "The next chapter is written with you: a ~6-week internship from 5 June 2027."),
  endText: b("Business, data & code. Un seul cerveau. Écrivez-moi, je réponds vite.", "Business, data & code. One brain. Write to me, I reply fast."),
  replay: b("Revoir l'histoire", "Replay the story"),
};

export const t = <T,>(v: Bi<T>, lang: Lang): T => v[lang];
