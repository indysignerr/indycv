import { useSyncExternalStore } from "react";

/**
 * Niveaux de qualité du rendu 3D : estimés au démarrage selon l'appareil, affinés dès que la carte graphique
 * est connue, puis abaissés en direct si la machine peine. Objectif : que le site reste fluide partout,
 * même sur un vieux téléphone.
 *
 * Les réglages « lourds » (ombres, ombres douces, ciel, relief des montagnes) sont fixés une fois pour toutes
 * avant le premier rendu : les changer en cours de visite obligerait à recompiler tous les programmes de rendu
 * (plusieurs secondes de blocage). En cours de route, on n'abaisse que des réglages sans recompilation :
 * résolution, herbe, figurants, nuages.
 */

export type Tier = "high" | "medium" | "low";

export type Quality = {
  tier: Tier;
  /** Résolution de rendu (multiplicateur de pixels) au départ et au maximum. */
  dprStart: number;
  dprMax: number;
  /** Anti-crénelage matériel (décidé à la création du contexte, non modifiable ensuite). */
  antialias: boolean;
  /** Ombres portées (et ombres douces à pénombre variable, coûteuses). */
  shadows: boolean;
  softShadows: boolean;
  shadowMap: number;
  /** Ciel physique avec nuages, ou dégradé simple (très économe). */
  sky: "physical" | "clouds" | "simple";
  /** Figurants : tous, un par lieu, aucun. */
  figures: "all" | "essential" | "none";
  /** Brins d'herbe animés sur le terrain de foot. */
  grass: number;
  /** Détail des montagnes (subdivisions autour × en profondeur). */
  mountains: [number, number];
};

const PRESETS: Record<Tier, Omit<Quality, "tier" | "dprStart" | "dprMax">> = {
  high: { antialias: true, shadows: true, softShadows: true, shadowMap: 1024, sky: "clouds", figures: "all", grass: 12000, mountains: [480, 44] },
  medium: { antialias: true, shadows: true, softShadows: false, shadowMap: 1024, sky: "physical", figures: "essential", grass: 4000, mountains: [360, 32] },
  low: { antialias: false, shadows: false, softShadows: false, shadowMap: 0, sky: "simple", figures: "none", grass: 0, mountains: [240, 20] },
};

const dprCap = (tier: Tier, mobile: boolean) => (tier === "high" ? (mobile ? 1.5 : 1.75) : tier === "medium" ? 1.25 : 1);

export function qualityFor(tier: Tier, mobile: boolean): Quality {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const max = Math.min(dpr, dprCap(tier, mobile));
  return { tier, dprMax: max, dprStart: Math.min(max, tier === "high" ? 1.5 : max), ...PRESETS[tier] };
}

export const isMobileDevice = () =>
  typeof window !== "undefined" && (window.matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

/**
 * Premier diagnostic, sans créer de contexte 3D (en créer un juste pour tester coûte cher : jusqu'à une seconde).
 * - `classic` : le navigateur ne connaît pas WebGL 2 (exigé par le moteur 3D) → version simple.
 * - sinon un niveau de départ prudent d'après la mémoire, le nombre de cœurs et le type d'appareil ;
 *   il sera affiné par `refineTier` dès que la carte graphique est connue.
 */
export function detectTier(): Tier | "classic" {
  if (typeof window === "undefined" || !("WebGL2RenderingContext" in window)) return "classic";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  if (mem <= 2 || cores <= 2) return "low";
  if (isMobileDevice()) return mem >= 4 && cores >= 6 ? "medium" : "low";
  if (mem <= 4 || cores <= 4) return "medium";
  return "high";
}

/**
 * Affinage avec le nom de la carte graphique (lu sur le contexte déjà créé par la scène).
 * Renvoie `classic` si le rendu est logiciel (sans carte graphique) : la 3D y serait injouable.
 */
export function refineTier(tier: Tier, renderer: string): Tier | "classic" {
  if (/SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer)) return "classic";
  const weakGpu = /Mali-(4|T[6-8])|Adreno \(TM\) [3-5]\d\d|PowerVR|Intel\(R\) (HD|UHD) Graphics( [2-6]\d\d\d?)?\b|Intel HD Graphics|GMA|GeForce (8|9|GT \d)|Radeon HD [2-6]/i.test(renderer);
  const strongGpu = /Apple M\d|RTX|GTX (9[6-8]|1[0-6])|Radeon (RX|Pro)|Adreno \(TM\) (6[4-9]|7)\d\d/i.test(renderer);
  if (weakGpu) return "low";
  if (strongGpu && tier === "medium" && !isMobileDevice()) return "high";
  return tier;
}

/** Petit magasin partagé (le niveau peut baisser en cours de visite). */
let current: Quality = qualityFor("medium", false);
const listeners = new Set<() => void>();
export const quality = {
  get: () => current,
  set(q: Quality) { current = q; listeners.forEach((l) => l()); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

const ORDER: Tier[] = ["high", "medium", "low"];
/** Un cran en dessous, sans rien recompiler (renvoie false si on est déjà au plus bas). */
export function stepDown(mobile: boolean) {
  const i = ORDER.indexOf(current.tier);
  if (i >= ORDER.length - 1) return false;
  const next = ORDER[i + 1], p = PRESETS[next];
  quality.set({
    ...current,
    tier: next,
    grass: p.grass,
    figures: p.figures,
    sky: current.sky === "clouds" ? "physical" : current.sky,
    dprMax: Math.min(current.dprMax, dprCap(next, mobile)),
  });
  return true;
}

/** Niveau courant, dans un composant React (se met à jour si le niveau baisse en cours de route). */
export const useQuality = () => useSyncExternalStore(quality.subscribe, quality.get, quality.get);
