"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Clip } from "@/lib/story";
import { scroll } from "@/lib/scroll-progress";

export { MODEL_URL as MODEL } from "@/lib/assets";
import { MODEL_URL as MODEL } from "@/lib/assets";
import { easter } from "@/lib/easter";
const FADE = 0.35;
/**
 * Applique l'écart au bras SANS l'empiler : le mélangeur d'animation ne réécrit un os que si sa valeur animée a changé
 * (à l'arrêt, souvent non) ; on garde donc la pose d'origine et on la corrige à chaque image.
 */
export type ArmPose = { base: THREE.Quaternion; applied: THREE.Quaternion; has: boolean };
export const newArmPose = (): ArmPose => ({ base: new THREE.Quaternion(), applied: new THREE.Quaternion(), has: false });
export function spreadArm(bone: THREE.Object3D, st: ArmPose, offset: THREE.Quaternion) {
  if (!(st.has && bone.quaternion.equals(st.applied))) st.base.copy(bone.quaternion); // nouvelle pose écrite par l'animation
  bone.quaternion.copy(st.base).multiply(offset);
  st.applied.copy(bone.quaternion);
  st.has = true;
}

/** Écart des bras (rad, autour de l'axe X local de l'os du bras) : au repos et en marchant. */
const ARM_IDLE = 0.12;
const ARM_WALK = 0.24;

/**
 * Personnage rigué (Mixamo). Il marche le long de `curve` selon `distance` (m),
 * et joue `action` quand il est à l'arrêt.
 */
export const Character = memo(function Character({ curve, distanceRef, speedRef, walkingRef }: {
  curve: THREE.Curve<THREE.Vector3>;
  distanceRef: React.MutableRefObject<number>;
  speedRef: React.MutableRefObject<number>;
  walkingRef: React.MutableRefObject<boolean>;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, group);
  const current = useRef<Clip | null>(null);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), q: new THREE.Quaternion(), m: new THREE.Matrix4(), up: new THREE.Vector3(0, 1, 0) }), []);
  // Bras écartés du corps : les animations Mixamo sont faites pour un buste plus fin que ce modèle,
  // sans correction les bras traversent le torse (surtout pendant la marche, où ils balancent en croisant).
  const arms = useMemo(() => ["mixamorigLeftArm", "mixamorigRightArm"].map((n) => scene.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o), [scene]);
  const abd = useRef({ angle: ARM_IDLE, q: new THREE.Quaternion(), x: new THREE.Vector3(1, 0, 0), keep: [] as ArmPose[] });

  // Outil de réglage (développement) : accès au squelette depuis la console
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __indyScene: THREE.Object3D }).__indyScene = scene;
  }, [scene]);

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat) { mat.roughness = 0.9; mat.metalness = 0; }
      }
    });
  }, [scene]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    // Marche / arrêt : fondu entre les deux clips, sans passer par React (et danse de la victoire si demandée)
    const celebrating = !walkingRef.current && performance.now() < scroll.celebrateUntil;
    const clip: Clip = walkingRef.current ? "walk" : celebrating ? "celebrate" : "idle";
    if (clip !== current.current) {
      const next = actions[clip];
      if (next) {
        const prev = current.current ? actions[current.current] : null;
        next.clampWhenFinished = clip === "celebrate";
        next.reset().setLoop(clip === "celebrate" ? THREE.LoopOnce : THREE.LoopRepeat, Infinity).fadeIn(FADE).play();
        if (prev && prev !== next) prev.fadeOut(FADE);
        current.current = clip;
      }
    }
    const L = curve.getLength();
    const u = THREE.MathUtils.clamp(distanceRef.current / L, 0, 1);
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    g.position.copy(tmp.p);
    // Orientation le long du chemin (le modèle regarde vers +Z)
    tmp.m.lookAt(tmp.t, new THREE.Vector3(0, 0, 0), tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    g.quaternion.slerp(tmp.q, 0.15);
    // Vitesse de la marche proportionnelle à la vitesse de scroll
    const w = actions["walk"];
    if (w && walkingRef.current) w.timeScale = THREE.MathUtils.clamp(Math.abs(speedRef.current) / 1.4, 0.6, 1.8) * Math.sign(speedRef.current || 1);
    // Phase du pas, pour caler le bruit des pas (son d'ambiance)
    if (w) { const d = w.getClip().duration; scroll.walkPhase = (((w.time % d) + d) % d) / d; }
    // Après l'animation (le mélangeur a déjà posé le squelette) : on écarte le haut des bras
    const A = abd.current;
    A.angle += ((walkingRef.current ? ARM_WALK : celebrating ? 0.02 : ARM_IDLE) - A.angle) * Math.min(1, dt * 4);
    A.q.setFromAxisAngle(A.x, -A.angle);
    arms.forEach((a, i) => spreadArm(a, (A.keep[i] ??= newArmPose()), A.q));
  });

  // Surprise : 5 clics sur Indy (zone invisible, jamais dessinée) = danse de la victoire
  const taps = useRef<number[]>([]);
  const tap = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    const now = performance.now();
    taps.current = [...taps.current.filter((t) => now - t < 2500), now];
    if (taps.current.length >= 5) {
      taps.current = [];
      easter.celebrate({ fr: "Tu as trouvé Indy : danse de la victoire 🎉", en: "You found Indy: victory dance 🎉" });
    }
  };

  return (
    <group ref={group}>
      <primitive object={scene} />
      <mesh visible={false} position={[0, 0.9, 0]} onClick={tap}><capsuleGeometry args={[0.32, 1.1, 4, 8]} /></mesh>
    </group>
  );
});

useGLTF.preload(MODEL);
