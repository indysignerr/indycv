"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Float, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-progress";
import { IndyCharacter, type Clip } from "./indy-character";

/**
 * Stations du chemin : une par section HTML. La caméra suit une courbe entre elles,
 * le personnage change d'animation quand on entre dans une station.
 */
const STATIONS: { at: number; cam: [number, number, number]; look: [number, number, number]; clip: Clip }[] = [
  { at: 0.0, cam: [2.2, 1.5, 5.6], look: [0.3, 1.0, 0], clip: "tennis-forehand" }, // hero : tennis
  { at: 0.18, cam: [-2.0, 1.8, 4.0], look: [0, 1.0, 0], clip: "walk" }, // parcours : on avance
  { at: 0.36, cam: [1.5, 1.2, 3.2], look: [0, 1.0, 0], clip: "soccer-kick" }, // parcours (foot)
  { at: 0.5, cam: [0, 1.6, 3.0], look: [0, 0.8, 0], clip: "typing" }, // projets : au clavier
  { at: 0.68, cam: [-1.8, 1.4, 3.6], look: [0, 1.0, 0], clip: "idle" }, // compétences
  { at: 0.82, cam: [2.0, 1.0, 3.4], look: [0, 1.0, 0], clip: "dance" }, // loisirs : concert
  { at: 1.0, cam: [0, 1.8, 4.5], look: [0, 1.1, 0], clip: "celebrate" }, // contact
];

export function World({ dark, mobile }: { dark: boolean; mobile: boolean }) {
  const camPath = useMemo(() => new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.cam)), false, "catmullrom", 0.3), []);
  const lookPath = useMemo(() => new THREE.CatmullRomCurve3(STATIONS.map((s) => new THREE.Vector3(...s.look)), false, "catmullrom", 0.3), []);
  const [clip, setClip] = useState<Clip>(STATIONS[0].clip);
  const smooth = useRef(0);
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), look: new THREE.Vector3() }), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();

  useFrame((_, dt) => {
    // Lissage du scroll → caméra
    smooth.current += (scroll.progress - smooth.current) * Math.min(1, dt * 6);
    const t = smooth.current;
    camPath.getPointAt(t, tmp.pos);
    lookPath.getPointAt(t, tmp.look);
    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.look);

    // Station courante (par seuils, avec un petit hystérésis)
    let idx = 0;
    for (let i = 0; i < STATIONS.length; i++) if (t >= STATIONS[i].at - 0.06) idx = i;
    if (STATIONS[idx].clip !== clip) setClip(STATIONS[idx].clip);

    // Jour / nuit : la lumière tourne avec le thème
    if (sun.current) {
      const target = dark ? 0.35 : 2.2;
      sun.current.intensity += (target - sun.current.intensity) * Math.min(1, dt * 3);
    }
  });

  const accent = dark ? "#FF5A36" : "#C93A18";
  const ground = dark ? "#15151C" : "#E8E4DC";

  return (
    <>
      <hemisphereLight args={[dark ? "#3a3450" : "#fff4e6", dark ? "#0B0B10" : "#d9d2c5", dark ? 0.6 : 0.9]} />
      <directionalLight ref={sun} position={[3, 5, 2]} intensity={dark ? 0.35 : 2.2} color={dark ? "#a7b4ff" : "#fff1d6"} castShadow={!mobile} shadow-mapSize={1024} shadow-bias={-0.0004} shadow-normalBias={0.04} />
      <pointLight position={[-2, 2, 1]} intensity={dark ? 6 : 1} color={accent} distance={8} />

      <IndyCharacter clip={clip} position={[0.6, 0, 0]} />

      {/* Sol + ombre de contact */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow>
        <circleGeometry args={[6, 48]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={dark ? 0.6 : 0.35} scale={6} blur={2.2} far={2} />

      {/* Objets flottants = projets (placeholders, cliquables plus tard) */}
      {!mobile &&
        [
          [-1.6, 1.4, -0.6],
          [1.7, 1.9, -0.8],
          [1.2, 0.6, -1.4],
        ].map((p, i) => (
          <Float key={i} speed={1.4 + i * 0.3} rotationIntensity={0.8} floatIntensity={1.2}>
            <RoundedBox args={[0.5, 0.5, 0.5]} radius={0.08} position={p as [number, number, number]} castShadow>
              <meshStandardMaterial color={i === 1 ? accent : ground} roughness={0.4} metalness={0.1} />
            </RoundedBox>
          </Float>
        ))}

      {/* Balle de tennis posée au sol */}
      <mesh position={[0.9, 0.06, 0.6]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#D7F03B" roughness={0.9} />
      </mesh>
    </>
  );
}
