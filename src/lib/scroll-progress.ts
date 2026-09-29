import type Lenis from "lenis";

/** État partagé HTML ↔ canvas : progression du scroll (0..1), vitesse, chapitre courant. */
export const scroll = {
  progress: 0,
  velocity: 0,
  chapter: -1,
  lenis: null as Lenis | null,
  started: false,
};
