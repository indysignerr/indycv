import type { Bi, Lang } from "./content";

export type Clip =
  | "idle" | "walk" | "walk-turn-left" | "walk-turn-right" | "open-door" | "tennis-forehand" | "soccer-kick"
  | "celebrate" | "write-board" | "typing" | "sit-idle" | "handshake" | "look-around" | "dance";

export type Palette = { accent: string; panel: string; ink: string; floor: string; wall: string };

export type Chapter = {
  id: string;
  /** Distance (m) le long du chemin où se trouve la porte d'entrée de la pièce. */
  door: number;
  /** Longueur de la pièce (m). */
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

/** Un chapitre = une expérience = une pièce. Le chemin fait ~90 m au total. */
export const chapters: Chapter[] = [
  {
    id: "tennis", door: 8, length: 9, clip: "tennis-forehand",
    day: { accent: "#C7D935", panel: "rgba(28,48,32,0.72)", ink: "#F4F7E8", floor: "#B7562F", wall: "#DDE5D3" },
    sunset: { accent: "#E4F04A", panel: "rgba(24,30,26,0.78)", ink: "#F4F7E8", floor: "#8E3E22", wall: "#B9B39E" },
    label: b("Chapitre 1 · Enfance", "Chapter 1 · Childhood"),
    title: b("Le court de tennis", "The tennis court"),
    quality: b("Endurance & précision", "Stamina & precision"),
    text: b("Six ans de compétition, plusieurs entraînements par semaine. On y apprend à perdre un point et à rejouer le suivant sans trembler.", "Six years of competition, several sessions a week. You learn to lose a point and play the next one without flinching."),
  },
  {
    id: "foot", door: 24, length: 9, clip: "soccer-kick",
    day: { accent: "#2ECC71", panel: "rgba(20,44,30,0.72)", ink: "#EEFBF2", floor: "#6FA85A", wall: "#E6ECE2" },
    sunset: { accent: "#7CF29C", panel: "rgba(18,26,22,0.78)", ink: "#EEFBF2", floor: "#5C8A48", wall: "#B4B0A6" },
    label: b("Chapitre 2 · Le collectif", "Chapter 2 · Team"),
    title: b("Le terrain de foot", "The football pitch"),
    quality: b("Esprit d'équipe", "Team spirit"),
    text: b("Huit ans en club. Le foot, c'est apprendre à jouer pour les autres, à parler sur le terrain, à accepter la décision du coach.", "Eight years in a club. Football is learning to play for others, to talk on the pitch, to accept the coach's call."),
  },
  {
    id: "lycee", door: 40, length: 9, clip: "look-around",
    day: { accent: "#F5B942", panel: "rgba(38,34,28,0.74)", ink: "#FFF7E6", floor: "#C8B89A", wall: "#E8E2D3" },
    sunset: { accent: "#FFC85C", panel: "rgba(26,22,20,0.8)", ink: "#FFF7E6", floor: "#8C7E66", wall: "#B8AE99" },
    label: b("Chapitre 3 · Le lycée", "Chapter 3 · High school"),
    title: b("Maths & physique", "Maths & physics"),
    quality: b("Méthode & rigueur", "Method & rigour"),
    text: b("Bac maths-physique au lycée Simone Veil. Le goût des modèles, des démonstrations propres et des résultats vérifiables.", "Maths & physics baccalaureate at Lycée Simone Veil. A taste for models, clean proofs and verifiable results."),
  },
  {
    id: "concertae", door: 56, length: 9, clip: "handshake",
    day: { accent: "#3D7BFF", panel: "rgba(24,30,44,0.74)", ink: "#EEF3FF", floor: "#A98866", wall: "#EFEBE2" },
    sunset: { accent: "#7FA6FF", panel: "rgba(18,20,30,0.8)", ink: "#EEF3FF", floor: "#7A6048", wall: "#B5AFA3" },
    label: b("Chapitre 4 · Concertae", "Chapter 4 · Concertae"),
    title: b("Le cabinet comptable", "The accounting firm"),
    quality: b("Fiabilité & échéances", "Reliability & deadlines"),
    text: b("Un an d'alternance à Cannes (2025-2026) : saisie, révision, clôtures, contact client. On ne rend pas un bilan à peu près.", "One year of apprenticeship in Cannes (2025-2026): bookkeeping, reviews, closings, client contact. You don't hand in an approximate balance sheet."),
  },
  {
    id: "indysigner", door: 72, length: 11, clip: "celebrate",
    day: { accent: "#FF5A36", panel: "rgba(20,18,26,0.78)", ink: "#F5F1EA", floor: "#3A3842", wall: "#6E5E58" },
    sunset: { accent: "#FF6B47", panel: "rgba(12,11,16,0.84)", ink: "#F5F1EA", floor: "#2A2830", wall: "#5A4C47" },
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
    id: "albert", door: 87, length: 13, clip: "look-around",
    day: { accent: "#1F3FBF", panel: "rgba(22,26,48,0.74)", ink: "#F2F4FF", floor: "#D9D3C7", wall: "#F1EDE4" },
    sunset: { accent: "#8FA4FF", panel: "rgba(14,16,30,0.82)", ink: "#F2F4FF", floor: "#9E9688", wall: "#B7B2AA" },
    label: b("Chapitre 6 · Aujourd'hui", "Chapter 6 · Today"),
    title: b("Albert School × Mines Paris-PSL", "Albert School × Mines Paris-PSL"),
    quality: b("Business, data & code", "Business, data & code"),
    text: b("Bachelor Business & Data (2026-2029). La suite de l'histoire s'écrit ici. Disponible pour un stage d'environ 6 semaines dès le 5 juin 2027.", "Bachelor in Business & Data (2026-2029). The next chapter is written here. Available for a ~6-week internship from 5 June 2027."),
    links: [{ label: "indyfrancois6@gmail.com", href: "mailto:indyfrancois6@gmail.com" }],
  },
];

export const PATH_LENGTH = 100;

export const storyUi = {
  introKicker: b("Une histoire animée", "An animated story"),
  introTitle: b("Vous allez découvrir, au fil d'une histoire animée, la vie et les expériences d'Indy François.", "You're about to discover, through an animated story, the life and experiences of Indy François."),
  introHint: b("Faites défiler pour avancer. Chaque porte ouvre une expérience.", "Scroll to move forward. Each door opens an experience."),
  start: b("Commencer l'histoire", "Start the story"),
  cv: b("Télécharger le CV", "Download the CV"),
  skip: b("Aller directement à la fin", "Skip to the end"),
  scrollHint: b("Défilez pour marcher", "Scroll to walk"),
  loading: b("Chargement du monde…", "Loading the world…"),
  end: b("Fin de l'histoire. Écrivons la suite ensemble.", "End of the story. Let's write the next one together."),
};

export const t = <T,>(v: Bi<T>, lang: Lang): T => v[lang];
