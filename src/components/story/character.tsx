"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Clip } from "@/lib/story";

const MODEL = "/models/indy.glb";
const FADE = 0.35;

/**
 * Personnage rigué (Mixamo). Il marche le long de `curve` selon `distance` (m),
 * et joue `action` quand il est à l'arrêt.
 */
export function Character({ curve, distanceRef, speedRef, action, walking }: {
  curve: THREE.Curve<THREE.Vector3>;
  distanceRef: React.MutableRefObject<number>;
  speedRef: React.MutableRefObject<number>;
  action: Clip;
  walking: boolean;
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

  const clip: Clip = walking ? "walk" : action;
  useEffect(() => {
    const next = actions[clip];
    if (!next) return;
    const prev = current.current ? actions[current.current] : null;
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(FADE).play();
    if (prev && prev !== next) prev.fadeOut(FADE);
    current.current = clip;
  }, [clip, actions]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
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
    if (w && walking) w.timeScale = THREE.MathUtils.clamp(Math.abs(speedRef.current) / 1.4, 0.6, 1.8) * Math.sign(speedRef.current || 1);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL);
