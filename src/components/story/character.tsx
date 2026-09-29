"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import type { Clip } from "@/lib/story";
import { Prop, type PropName } from "./assets";

const MODEL = "/models/indy.glb";
const FADE = 0.35;

/**
 * Personnage rigué (Mixamo). Il marche le long de `curve` selon `distance` (m),
 * et joue `action` quand il est à l'arrêt.
 */
export function Character({ curve, distanceRef, speedRef, action, walking, handProp }: {
  curve: THREE.Curve<THREE.Vector3>;
  distanceRef: React.MutableRefObject<number>;
  speedRef: React.MutableRefObject<number>;
  action: Clip;
  walking: boolean;
  handProp: PropName | null;
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, group);
  const current = useRef<Clip | null>(null);
  const hand = useMemo(() => scene.getObjectByName("mixamorigRightHand") as THREE.Object3D | undefined, [scene]);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), q: new THREE.Quaternion(), m: new THREE.Matrix4(), up: new THREE.Vector3(0, 1, 0) }), []);

  useEffect(() => {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat?.name?.startsWith("Std_Skin")) { mat.roughness = 0.55; }
        if (mat?.name?.startsWith("lambert3")) { mat.roughness = 0.9; }
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
      {handProp && hand && <HandProp parent={hand} name={handProp} />}
    </group>
  );
}

/** Objet attaché à un os de la main (portal R3F vers l'os). */
function HandProp({ parent, name }: { parent: THREE.Object3D; name: PropName }) {
  const holder = useRef<THREE.Group>(null);
  useEffect(() => {
    const g = holder.current;
    if (!g) return;
    parent.add(g);
    return () => { parent.remove(g); };
  }, [parent]);
  return (
    <group ref={holder} position={[0, 0.16, 0.03]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
      <Prop name={name} scale={1} position={[0, 0, 0]} />
    </group>
  );
}

useGLTF.preload(MODEL);
