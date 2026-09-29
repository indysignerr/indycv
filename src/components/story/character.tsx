"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Clip } from "@/lib/story";
import { scroll } from "@/lib/scroll-progress";

const MODEL = "/models/indy.glb";
const FADE = 0.35;

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

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // Marche / arrêt : fondu entre les deux clips, sans passer par React
    const clip: Clip = walkingRef.current ? "walk" : "idle";
    if (clip !== current.current) {
      const next = actions[clip];
      if (next) {
        const prev = current.current ? actions[current.current] : null;
        next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(FADE).play();
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
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
});

useGLTF.preload(MODEL);
