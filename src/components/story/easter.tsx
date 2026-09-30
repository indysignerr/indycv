"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";
import { useApp } from "@/components/providers";
import { easter } from "@/lib/easter";
import { ambience } from "@/lib/ambience";
import { SITE } from "@/lib/content";
import { DYNAMIC } from "./static-merge";

/**
 * Surprises cachées. Au repos, elles ne coûtent rien : pas de calcul par image (sortie immédiate),
 * des zones de clic invisibles (jamais dessinées), et quelques secondes d'animation une fois déclenchées.
 */

/** Rebond amorti : durée de chaque rebond × 0,7, hauteur × 0,49. Instants et volumes des chocs pour le son. */
const T0 = 0.46, K = 0.7;
const IMPACTS: [number, number][] = [[0, 0.8], [T0, 1], [T0 * (1 + K), 0.6], [T0 * (1 + K + K * K), 0.35]];

/** Objet qui rebondit quand on clique dessus (balles de tennis, ballons). Les enfants sont centrés sur l'origine. */
export function Bouncy({ id, position, lift, height = 0.9, hit = 0.3, sound, onFound, children }: {
  id: string; position: [number, number, number]; lift: number; height?: number; hit?: number;
  sound: "pock" | "thump"; onFound?: (id: string) => void; children: React.ReactNode;
}) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(-1);
  useFrame((_, dt) => {
    if (t.current < 0 || !g.current) return;
    t.current += dt;
    let x = t.current, T = T0, h = height;
    while (x > T && T > 0.06) { x -= T; T *= K; h *= K * K; }
    if (T <= 0.06) { g.current.position.y = lift; g.current.rotation.set(0, 0, 0); t.current = -1; return; }
    const u = x / T;
    g.current.position.y = lift + 4 * h * u * (1 - u);
    g.current.rotation.x += dt * 9;
  });
  return (
    <group position={position} userData={DYNAMIC}>
      <group ref={g} position={[0, lift, 0]}>{children}</group>
      <mesh visible={false} position={[0, lift, 0]} onClick={(e) => {
        e.stopPropagation();
        if (t.current >= 0) return;
        t.current = 0;
        ambience.sfx(sound, IMPACTS);
        onFound?.(id);
      }}>
        <sphereGeometry args={[hit, 8, 6]} />
      </mesh>
    </group>
  );
}

/** Guitare : un clic gratte un accord (ou invite à activer le son s'il est coupé). */
export function Strummable({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const t = useRef(-1);
  useFrame((_, dt) => {
    if (t.current < 0 || !g.current) return;
    t.current += dt;
    g.current.rotation.z = Math.sin(t.current * 26) * 0.05 * Math.exp(-t.current * 4);
    if (t.current > 1.2) { g.current.rotation.z = 0; t.current = -1; }
  });
  return (
    <group userData={DYNAMIC}>
      <group ref={g}>{children}</group>
      <mesh visible={false} position={[0, 0.7, 0]} onClick={(e) => {
        e.stopPropagation();
        if (ambience.enabled) { ambience.sfx("strum"); t.current = 0; }
        else easter.toast({ fr: "🎸 Active le son pour l'entendre", en: "🎸 Turn the sound on to hear it" });
      }}>
        <boxGeometry args={[0.5, 1.5, 0.3]} />
      </mesh>
    </group>
  );
}

/** Balles de tennis : les 5 trouvées donnent « jeu, set et match ». */
export function foundTennisBall(id: string) {
  easter.found.add(id);
  const n = [...easter.found].filter((k) => k.startsWith("tennis-")).length;
  if (n === 5 && !easter.found.has("tennis-done")) {
    easter.found.add("tennis-done");
    easter.toast({ fr: "Jeu, set et match : 5 balles sur 5 🎾", en: "Game, set and match: 5 balls out of 5 🎾" });
  }
}

/** Code Konami (↑ ↑ ↓ ↓ ← → ← → B A) et petit mot dans la console pour les curieux. */
export function EasterEggs() {
  const { lang } = useApp();
  const said = useRef(false);
  useEffect(() => {
    if (said.current) return;
    said.current = true;
    const fr = lang === "fr";
    console.log("%cIF.%c  Business, data & code.", "font:800 26px/1.4 system-ui,sans-serif;color:#FF5A36", "font:600 14px/1.4 system-ui,sans-serif;color:inherit");
    console.log(fr
      ? `Tu regardes sous le capot ? J'aime ça. Écris-moi : ${SITE.email}\nPetit secret : ↑ ↑ ↓ ↓ ← → ← → B A (ou clique 5 fois sur Indy).`
      : `Looking under the hood? I like that. Write to me: ${SITE.email}\nLittle secret: ↑ ↑ ↓ ↓ ← → ← → B A (or click Indy 5 times).`);
  }, [lang]);
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
      if (i === seq.length) {
        i = 0;
        easter.celebrate({ fr: "Code Konami ! Indy fête ta trouvaille 🎉", en: "Konami code! Indy celebrates your find 🎉" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return null;
}

/** Message des surprises, discret, en haut de l'écran. */
export function EasterToast() {
  const { lang } = useApp();
  const toast = useSyncExternalStore(easter.subscribe, easter.get, () => null);
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[72px] z-50 flex justify-center px-4 sm:top-24">
      {toast && (
        <p key={toast.id} className="animate-in fade-in slide-in-from-top-2 rounded-full border border-white/10 bg-[rgba(14,14,20,0.82)] px-5 py-2.5 text-center font-display text-sm font-semibold text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] backdrop-blur-md duration-300">
          {toast.text[lang]}
        </p>
      )}
    </div>
  );
}
