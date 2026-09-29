import type Lenis from "lenis";

/** État partagé HTML ↔ canvas : progression du scroll (0..1), vitesse, chapitre courant. */
/** Découpage du scroll (en hauteurs d'écran) : accueil, histoire, page de fin. */
export const INTRO_VH = 150;
export const END_VH = 150;
export const STORY_VH = 6 * 220 + 120;
export const TOTAL_VH = INTRO_VH + STORY_VH + END_VH;

/** Convertit la progression brute du scroll (0..1) en trois grandeurs. */
export function splitProgress(raw: number) {
  const a = INTRO_VH / TOTAL_VH, b = END_VH / TOTAL_VH;
  return {
    story: Math.min(1, Math.max(0, (raw - a) / (1 - a - b))),
    // L'accueil reste plein écran puis s'efface sur le dernier tiers de sa zone
    intro: Math.min(1, Math.max(0, (a - raw) / (a * 0.35))),
    // La fin apparaît sur le premier tiers de sa zone puis reste affichée
    end: Math.min(1, Math.max(0, (raw - (1 - b)) / (b * 0.35))),
  };
}

export const scroll = {
  /** Progression de l'histoire (0 = départ du chemin, 1 = sortie d'Albert School). */
  progress: 0,
  raw: 0,
  intro: 1,
  end: 0,
  velocity: 0,
  chapter: -1,
  lenis: null as Lenis | null,
  started: false,
  /** Hotspot ouvert (id) ou null. */
  hotspot: null as string | null,
  /** Souris normalisée (-1..1) pour la vue 360 dans la chambre. */
  mouse: { x: 0, y: 0 },
};
