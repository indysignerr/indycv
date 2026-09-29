import { useSyncExternalStore } from "react";

/**
 * Préparation de l'histoire 3D : progression du chargement (0..1) et « prête » quand tout est chargé,
 * compilé et envoyé à la carte graphique. Tant qu'elle n'est pas prête, l'accueil reste affiché.
 */
type State = { progress: number; ready: boolean };

let state: State = { progress: 0, ready: false };
const listeners = new Set<() => void>();
const SERVER: State = { progress: 0, ready: false };

export const loading = {
  get: () => state,
  set(patch: Partial<State>) {
    const next = { ...state, ...patch };
    if (next.ready === state.ready && Math.abs(next.progress - state.progress) < 0.01) return;
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
};

export const useLoading = () => useSyncExternalStore(loading.subscribe, loading.get, () => SERVER);
