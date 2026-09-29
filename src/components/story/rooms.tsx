"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter, Palette } from "@/lib/story";
import type { Lang } from "@/lib/content";
import { Prop, usePBR, type TexName } from "./assets";

const up = new THREE.Vector3(0, 1, 0);

/** Repère local du chemin à la distance d : position, tangente, côté, quaternion (Z = tangente). */
export function frameAt(curve: THREE.Curve<THREE.Vector3>, d: number) {
  const u = THREE.MathUtils.clamp(d / curve.getLength(), 0, 1);
  const p = curve.getPointAt(u), t = curve.getTangentAt(u);
  const s = new THREE.Vector3().crossVectors(up, t).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(t, new THREE.Vector3(), up));
  return { p, t, s, q };
}

/** Porte à double battant dans un cadre bois ; s'ouvre à l'approche du personnage. */
export function Door({ curve, at, distanceRef, palette, sunset }: { curve: THREE.Curve<THREE.Vector3>; at: number; distanceRef: React.MutableRefObject<number>; palette: Palette; sunset: boolean }) {
  const f = useMemo(() => frameAt(curve, at), [curve, at]);
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  const wood = usePBR("wood", [1, 2]);
  useFrame((_, dt) => {
    const d = distanceRef.current - at;
    const open = d > -2.6 && d < 4;
    const target = open ? Math.PI * 0.58 : 0;
    if (left.current) left.current.rotation.y += (-target - left.current.rotation.y) * Math.min(1, dt * 2.6);
    if (right.current) right.current.rotation.y += (target - right.current.rotation.y) * Math.min(1, dt * 2.6);
  });
  return (
    <group position={f.p} quaternion={f.q}>
      {/* Montants + linteau */}
      {[-1.15, 1.15].map((x) => (
        <mesh key={x} position={[x, 1.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 2.4, 0.3]} />
          <meshStandardMaterial {...wood} color="#8a6a48" />
        </mesh>
      ))}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.3, 0.3]} />
        <meshStandardMaterial {...wood} color="#8a6a48" />
      </mesh>
      {/* Battants, pivot sur les bords */}
      {[[-1, left], [1, right]].map(([s, ref]) => (
        <group key={String(s)} ref={ref as React.RefObject<THREE.Group>} position={[(s as number) * 1.0, 0, 0]}>
          <mesh position={[-(s as number) * 0.5, 1.2, 0]} castShadow>
            <boxGeometry args={[1.0, 2.4, 0.06]} />
            <meshStandardMaterial color={palette.accent} roughness={0.45} metalness={0.1} emissive={palette.accent} emissiveIntensity={sunset ? 0.08 : 0} />
          </mesh>
          <mesh position={[-(s as number) * 0.85, 1.15, 0.06]}>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshStandardMaterial color="#d9c48a" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

type RoomSpec = { width: number; floor: TexName; floorRepeat: [number, number]; wall: TexName; ceiling?: boolean; wallHeight?: number; contents: (p: { len: number; wid: number; palette: Palette; active: boolean; sunset: boolean }) => React.ReactNode };

/** Contenu de chaque pièce : props Sketchfab positionnés dans le repère de la pièce (Z = sens de marche, X = côté droit). */
export const ROOMS: Record<string, RoomSpec> = {
  tennis: {
    width: 13, floor: "clay", floorRepeat: [6, 6], wall: "plaster", ceiling: false, wallHeight: 1.1,
    contents: ({ len }) => (
      <>
        <Prop name="tennis-court" scale={0.42} position={[-1.8, 0.01, 0]} rotation={[0, Math.PI / 2, 0]} />
        <Prop name="ball" scale={0.3} position={[1.3, 0.04, -len / 4]} />
      </>
    ),
  },
  foot: {
    width: 12, floor: "grass", floorRepeat: [5, 5], wall: "plaster", ceiling: false, wallHeight: 1.1,
    contents: ({ wid }) => (
      <>
        <Prop name="goal" position={[wid / 2 - 1.4, 0, 0.5]} rotation={[0, Math.PI, 0]} />
        <Prop name="ball" position={[0.9, 0.11, 0.2]} />
        {/* Ligne de but */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wid / 2 - 2.4, 0.012, 0.5]}>
          <planeGeometry args={[0.08, 7]} />
          <meshStandardMaterial color="#f4f4f4" roughness={1} />
        </mesh>
      </>
    ),
  },
  lycee: {
    width: 9, floor: "wood", floorRepeat: [4, 4], wall: "plaster",
    contents: ({ len, wid }) => (
      <>
        <Prop name="chalkboard" position={[-wid / 2 + 0.7, 0, -1.2]} rotation={[0, Math.PI / 2, 0]} />
        {[-2.4, -0.8, 0.8, 2.4].map((z, i) => (
          <Prop key={i} name="school-desk" position={[-wid / 2 + 2.6, 0, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}
      </>
    ),
  },
  concertae: {
    width: 9, floor: "wood", floorRepeat: [4, 4], wall: "plaster",
    contents: ({ len, wid }) => (
      <>
        <Prop name="computer-desk" position={[-wid / 2 + 1.5, 0, -1.8]} rotation={[0, Math.PI / 2, 0]} />
        <Prop name="computer-desk" position={[-wid / 2 + 1.5, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} />
        <Prop name="bookshelf" scale={0.9} position={[-1.2, 0, len / 2 - 0.5]} rotation={[0, 0, 0]} />
      </>
    ),
  },
  indysigner: {
    width: 10, floor: "concrete", floorRepeat: [4, 4], wall: "brick",
    contents: ({ wid, palette, active }) => (
      <>
        <Prop name="computer-desk" position={[-wid / 2 + 1.5, 0, 3.4]} rotation={[0, Math.PI / 2, 0]} />
        <Prop name="laptop" position={[-wid / 2 + 1.8, 0.74, 0.6]} rotation={[0, Math.PI / 3, 0]} />
        <mesh position={[-wid / 2 + 1.8, 0.36, 0.6]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.72, 0.7]} />
          <meshStandardMaterial color="#2a2830" roughness={0.6} />
        </mesh>
        {["indysigner.fr", "lovive.fr", "manikalab.com", "nayumatea.com"].map((s, i) => (
          <Float key={s} speed={1.2 + i * 0.25} rotationIntensity={0.5} floatIntensity={0.7}>
            <group position={[-3.6 + i * 1.2, 1.75 + (i % 2) * 0.55, 2.2 + (i % 2) * 0.8]} rotation={[0, 0.35, 0]}>
              <RoundedBox args={[1.0, 0.62, 0.06]} radius={0.05} castShadow>
                <meshStandardMaterial color="#15141b" roughness={0.3} metalness={0.2} emissive={palette.accent} emissiveIntensity={active ? 0.25 : 0.05} />
              </RoundedBox>
              <Text position={[0, 0, 0.04]} fontSize={0.09} color={palette.accent} anchorX="center" anchorY="middle">{s}</Text>
            </group>
          </Float>
        ))}
      </>
    ),
  },
  albert: {
    width: 10, floor: "wood", floorRepeat: [4, 4], wall: "plaster",
    contents: ({ wid, len }) => (
      <>
        {[-3.0, -0.4].map((z, i) => (
          <Prop key={i} name="bookshelf" position={[-wid / 2 + 0.7, 0, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}
        <Prop name="bookshelf" position={[-2.0, 0, len / 2 - 0.5]} rotation={[0, 0, 0]} />
        <Prop name="school-desk" position={[-wid / 2 + 2.6, 0, 1.6]} rotation={[0, Math.PI / 2, 0]} />
        <Prop name="school-desk" position={[-wid / 2 + 2.6, 0, 3.0]} rotation={[0, Math.PI / 2, 0]} />
      </>
    ),
  },
};

/** Pièce traversée par le chemin : sol, murs, plafond avec puits de lumière, contenu. */
export function Room({ curve, chapter, palette, sunset, active, lang }: { curve: THREE.Curve<THREE.Vector3>; chapter: Chapter; palette: Palette; sunset: boolean; active: boolean; lang: Lang }) {
  const spec = ROOMS[chapter.id];
  const mid = chapter.door + chapter.length / 2;
  const f = useMemo(() => frameAt(curve, mid), [curve, mid]);
  const len = chapter.length + 0.4, wid = spec.width, h = spec.wallHeight ?? 3.6;
  const floor = usePBR(spec.floor, spec.floorRepeat);
  const wall = usePBR(spec.wall, [3, 1.2]);
  const hasCeiling = spec.ceiling !== false;
  const light = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    const goal = hasCeiling ? (active ? (sunset ? 60 : 40) : 8) : (active ? (sunset ? 14 : 4) : 1);
    if (light.current) light.current.intensity += (goal - light.current.intensity) * Math.min(1, dt * 2);
  });
  return (
    <group position={f.p} quaternion={f.q}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]} receiveShadow>
        <planeGeometry args={[wid, len]} />
        <meshStandardMaterial {...floor} color={palette.floor} roughness={1} />
      </mesh>
      {/* Murs latéraux */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * wid / 2, h / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.25, h, len]} />
          <meshStandardMaterial {...wall} color={palette.wall} />
        </mesh>
      ))}
      {/* Murs avant/arrière avec l'ouverture de la porte (2,4 m) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[0, 0, s * len / 2]}>
          {[-1, 1].map((x) => (
            <mesh key={x} position={[x * (wid / 4 + 0.6), h / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[wid / 2 - 1.2, h, 0.25]} />
              <meshStandardMaterial {...wall} color={palette.wall} />
            </mesh>
          ))}
          {h > 2.6 && (
            <mesh position={[0, (h + 2.6) / 2, 0]} castShadow receiveShadow>
              <boxGeometry args={[2.4, h - 2.6, 0.25]} />
              <meshStandardMaterial {...wall} color={palette.wall} />
            </mesh>
          )}
        </group>
      ))}
      {hasCeiling && (
        <>
          <mesh position={[0, h, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[wid, len]} />
            <meshStandardMaterial color={palette.wall} roughness={0.95} side={THREE.DoubleSide} />
          </mesh>
          {/* Puits de lumière */}
          <mesh position={[0, h - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[wid * 0.5, len * 0.35]} />
            <meshStandardMaterial color="#ffffff" emissive={sunset ? "#ffb27a" : "#ffffff"} emissiveIntensity={sunset ? 1.6 : 2.4} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      <pointLight ref={light} position={[0, 3.0, 0]} color="#fff2e0" distance={20} decay={2} intensity={2} />
      {hasCeiling && <pointLight position={[0, 2.4, 0]} color={palette.accent} distance={12} decay={2} intensity={active ? 12 : 3} />}
      <Text position={[-wid / 2 + 0.16, hasCeiling ? 2.6 : 0.75, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.42} color={palette.accent} anchorX="center" anchorY="middle" maxWidth={len - 1}>
        {chapter.title[lang]}
      </Text>
      {spec.contents({ len, wid, palette, active, sunset })}
    </group>
  );
}
