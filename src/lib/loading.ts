import { useSyncExternalStore } from "react";

/**
 * Préparation de l'histoire 3D.
 * - `progress` : avancement réel (0..1), rapporté finement par chaque étape (octets, pièces construites,
 *   programmes compilés, textures, objets préparés) ;
 * - `ceiling` : plafond de l'étape en cours. La barre affichée glisse en continu vers ce plafond sans jamais
 *   l'atteindre tant que l'étape n'est pas finie : elle ne reste jamais figée, et ne recule jamais.
 * - `ready` : tout est chargé, compilé et envoyé à la carte graphique.
 */
type State = { progress: number; ceiling: number; ready: boolean };

/** Étapes et leur part de la barre (proportionnelles à leur durée typique). */
export const PHASES = { download: [0, 0.4], build: [0.4, 0.5], compile: [0.5, 0.8], textures: [0.8, 0.85], warm: [0.85, 0.985] } as const;
export type Phase = keyof typeof PHASES;

let state: State = { progress: 0, ceiling: PHASES.download[1], ready: false };
const listeners = new Set<() => void>();
const SERVER: State = { progress: 0, ceiling: PHASES.download[1], ready: false };

export const loading = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch, progress: Math.max(state.progress, patch.progress ?? state.progress) };
    if (next.ready === state.ready && next.ceiling === state.ceiling && next.progress - state.progress < 0.004) return;
    state = next;
    listeners.forEach((l) => l());
  },
  /** Avancement dans une étape (fraction 0..1 de l'étape). */
  phase(p: Phase, fraction: number) {
    const [a, b] = PHASES[p];
    loading.set({ progress: a + (b - a) * Math.min(1, Math.max(0, fraction)), ceiling: b });
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export const useLoading = () => useSyncExternalStore(loading.subscribe, loading.get, () => SERVER);
/** Seulement « prête ou pas » (évite de refaire le rendu à chaque pour-cent). */
export const useReady = () => useSyncExternalStore(loading.subscribe, () => loading.get().ready, () => false);
