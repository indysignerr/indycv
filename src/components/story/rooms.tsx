"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Chapter, Palette } from "@/lib/story";
import { Flat } from "./materials";
import { Bookshelf, Chair, Chalkboard, Desk, Goal, Lamp, Laptop, ProjectCard, SoccerBall, TennisBall, TennisCourt, Tree } from "./props";

const up = new THREE.Vector3(0, 1, 0);

/** Repère local du chemin à la distance d (Z local = sens de marche, X local = droite). */
export function frameAt(curve: THREE.Curve<THREE.Vector3>, d: number) {
  const u = THREE.MathUtils.clamp(d / curve.getLength(), 0, 1);
  const p = curve.getPointAt(u), t = curve.getTangentAt(u);
  const s = new THREE.Vector3().crossVectors(up, t).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(t, new THREE.Vector3(), up));
  return { p, t, s, q };
}

/**
 * Diorama : une dalle, un mur du fond (côté gauche du chemin, loin de la caméra) et un contenu.
 * Ouvert côté caméra, jamais de plafond : on garde la lumière et la lisibilité.
 */
export function Diorama({ curve, chapter, palette, active, sunset }: { curve: THREE.Curve<THREE.Vector3>; chapter: Chapter; palette: Palette; active: boolean; sunset: boolean }) {
  const mid = chapter.at + chapter.length / 2;
  const f = useMemo(() => frameAt(curve, mid), [curve, mid]);
  const len = chapter.length, wid = 11;
  const a = palette.accent;
  return (
    <group position={f.p} quaternion={f.q}>
      {/* Dalle du diorama (léger relief) */}
      <mesh position={[-1.5, -0.12, 0]} receiveShadow>
        <boxGeometry args={[wid, 0.24, len + 1.5]} />
        <Flat color={palette.floor} />
      </mesh>
      {/* Mur du fond + retour, à gauche du chemin */}
      {chapter.id !== "tennis" && chapter.id !== "foot" && (
        <>
          <mesh position={[-wid / 2 - 1.5 + 0.15, 1.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 3.2, len + 1.5]} />
            <Flat color={palette.wall} />
          </mesh>
          <mesh position={[-1.5, 1.6, (len + 1.5) / 2 - 0.15]} castShadow receiveShadow>
            <boxGeometry args={[wid, 3.2, 0.3]} />
            <Flat color={palette.wall} />
          </mesh>
          {/* Bandeau d'accent en haut du mur */}
          <mesh position={[-wid / 2 - 1.5 + 0.32, 3.0, 0]}>
            <boxGeometry args={[0.04, 0.12, len + 1.2]} />
            <Flat color={a} emissive={a} emissiveIntensity={0.6} />
          </mesh>
        </>
      )}
      <Contents chapter={chapter} palette={palette} active={active} sunset={sunset} len={len} wid={wid} />
    </group>
  );
}

function Contents({ chapter, palette, active, sunset, len, wid }: { chapter: Chapter; palette: Palette; active: boolean; sunset: boolean; len: number; wid: number }) {
  const a = palette.accent;
  const L = -wid / 2 - 1.5; // bord gauche
  switch (chapter.id) {
    case "tennis":
      return (
        <group>
          <group position={[-3.6, 0, 0]}><TennisCourt width={5.5} length={len - 1} color={sunset ? "#2E6A4A" : "#3F8F63"} /></group>
          <TennisBall position={[-0.9, 0.07, 1.6]} />
          {/* Grillage bas côté fond */}
          {[1].map((s) => <mesh key={s} position={[-3.6, 0.55, s * (len / 2 + 0.2)]}><boxGeometry args={[6.5, 1.1, 0.04]} /><meshStandardMaterial color="#DDE6DF" transparent opacity={0.35} roughness={1} /></mesh>)}
          <Tree position={[L + 1.2, 0, -len / 2 + 1]} scale={1.2} color={sunset ? "#4C8A5A" : "#5FA86A"} />
          <Tree position={[L + 2.4, 0, len / 2 - 0.5]} scale={0.9} color={sunset ? "#4C8A5A" : "#6DB57A"} />
        </group>
      );
    case "foot":
      return (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.01, 0]} receiveShadow><planeGeometry args={[6, len]} /><Flat color={sunset ? "#3E8546" : "#4CA455"} /></mesh>
          {[0.25, 0.5].map((k, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-3.5 + (i ? 0 : 0), 0.02, 0]}><ringGeometry args={[1.1 - i * 0.06, 1.16 - i * 0.06, 32]} /><Flat color="#F4F4F2" /></mesh>)}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.5, 0.02, 0]}><planeGeometry args={[0.06, len]} /><Flat color="#F4F4F2" /></mesh>
          <Goal position={[L + 1.4, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <SoccerBall position={[-0.8, 0.13, 0.8]} />
          <Tree position={[L + 0.8, 0, len / 2 + 0.2]} scale={1.1} color={sunset ? "#4C8A5A" : "#5FA86A"} />
        </group>
      );
    case "lycee":
      return (
        <group>
          <Chalkboard position={[L + 0.55, 0, 0.4]} rotation={[0, Math.PI / 2, 0]} accent={a} />
          {[-2.2, -0.6, 1.0].map((z, i) => (
            <group key={i}>
              <Desk position={[-4.2, 0, z]} rotation={[0, Math.PI / 2, 0]} top={sunset ? "#B08E68" : "#D2B48C"} />
              <Chair position={[-3.35, 0, z]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ))}
          <Lamp position={[-3.4, 2.6, 0]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
    case "concertae":
      return (
        <group>
          <Desk position={[-4.4, 0, -1.6]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#8C7458" : "#B79A7C"} />
          <Chair position={[-3.5, 0, -1.6]} rotation={[0, Math.PI / 2, 0]} />
          <Desk position={[-4.4, 0, 1.2]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#8C7458" : "#B79A7C"} />
          <Chair position={[-3.5, 0, 1.2]} rotation={[0, Math.PI / 2, 0]} />
          <Bookshelf position={[-2.0, 0, len / 2 + 0.35]} books={[a, "#E9E4D6", "#2A4BD7", "#F5B942", "#C9C4BA"]} />
          <Lamp position={[-3.6, 2.6, -0.2]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
    case "indysigner":
      return (
        <group>
          <Desk position={[-4.4, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} top="#2A2830" legs="#15141B" />
          <Laptop position={[-4.4, 0.78, 1.0]} rotation={[0, Math.PI / 2 + 0.3, 0]} accent={a} />
          <Chair position={[-3.5, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} color="#15141B" />
          {["indysigner.fr", "lovive.fr", "manikalab.com", "nayumatea.com"].map((s, i) => (
            <ProjectCard key={s} position={[-5.2 + i * 1.25, 1.8 + (i % 2) * 0.5, -2.2 + (i % 2) * 0.6]} label={s} accent={a} active={active} />
          ))}
          <Lamp position={[-3.8, 2.6, 0.6]} color={a} intensity={active ? 12 : 4} />
        </group>
      );
    case "albert":
      return (
        <group>
          {[-1.8, -0.4].map((z, i) => <Bookshelf key={i} position={[L + 0.5, 0, z]} rotation={[0, Math.PI / 2, 0]} books={[a, "#E9E4D6", "#FF5A36", "#F5B942", "#5FA86A"]} />)}
          <Desk position={[-4.2, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#A79E90" : "#DCD6CA"} />
          <Chair position={[-3.35, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} />
          <Lamp position={[-3.4, 2.6, 0.2]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
  }
  return null;
}
