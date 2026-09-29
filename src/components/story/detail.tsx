"use client";

import { useMemo } from "react";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Flat } from "./materials";
import {
  beamTex, blobTex, chalkboardTex, clayTex, codeTex, dashboardTex, edgeTex, grassTex, meshAlpha, plasterTex, posterTex, spreadsheetTex, woodTex,
} from "./textures";

type V3 = [number, number, number];

/* ─────────────────────────── Matières et finitions ─────────────────────────── */

/** Matériau texturé : la texture donne le détail, `color` la teinte ; la même texture sert de relief. */
export function TexMat({ tex, color, bump = 0.012, rough = 0.85, metal = 0 }: { tex: THREE.Texture; color: string; bump?: number; rough?: number; metal?: number }) {
  return <meshStandardMaterial map={tex} bumpMap={tex} bumpScale={bump} color={color} roughness={rough} metalness={metal} />;
}

/** Ombre de contact douce, posée au sol sous un objet. */
export function Blob({ position, size, opacity = 0.7 }: { position: V3; size: [number, number]; opacity?: number }) {
  const t = useMemo(() => blobTex(), []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], position[1] + 0.012, position[2]]} renderOrder={1}>
      <planeGeometry args={size} />
      <meshBasicMaterial map={t} transparent opacity={opacity} depthWrite={false} color="#000" />
    </mesh>
  );
}

/** Occlusion d'angle : bande sombre au pied d'un mur (le dégradé part du mur). */
export function WallAO({ position, length, rotationY = 0, width = 0.8 }: { position: V3; length: number; rotationY?: number; width?: number }) {
  const t = useMemo(() => edgeTex(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.013, width / 2]} renderOrder={1}>
        <planeGeometry args={[length, width]} />
        <meshBasicMaterial map={t} transparent depthWrite={false} color="#000" />
      </mesh>
    </group>
  );
}

/** Plinthe. */
export function Baseboard({ position, length, rotationY = 0, color = "#FFFFFF" }: { position: V3; length: number; rotationY?: number; color?: string }) {
  return <mesh position={[position[0], 0.06, position[2]]} rotation={[0, rotationY, 0]}><boxGeometry args={[length, 0.12, 0.03]} /><Flat color={color} roughness={0.5} /></mesh>;
}

/** Fenêtre posée sur un mur (face vers +z local), avec rebord et faisceau de lumière au sol. */
export function Window({ position, rotationY = 0, w = 1.8, h = 1.3, sunset, blinds = false, beam = true }: { position: V3; rotationY?: number; w?: number; h?: number; sunset: boolean; blinds?: boolean; beam?: boolean }) {
  const bt = useMemo(() => beamTex(), []);
  const sky = sunset ? "#F4B083" : "#CFE6F7";
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.02]}><boxGeometry args={[w + 0.16, h + 0.16, 0.06]} /><Flat color="#FAFAF7" roughness={0.4} /></mesh>
      <mesh position={[0, 0, 0.012]}><planeGeometry args={[w, h]} /><meshBasicMaterial color={sky} toneMapped={false} /></mesh>
      {/* Montants et traverse */}
      <mesh position={[0, 0, 0.03]}><boxGeometry args={[0.05, h, 0.04]} /><Flat color="#FAFAF7" /></mesh>
      <mesh position={[0, h * 0.18, 0.03]}><boxGeometry args={[w, 0.05, 0.04]} /><Flat color="#FAFAF7" /></mesh>
      {/* Rebord */}
      <mesh position={[0, -h / 2 - 0.06, 0.1]} castShadow><boxGeometry args={[w + 0.3, 0.05, 0.22]} /><Flat color="#F1EEE8" /></mesh>
      {blinds && Array.from({ length: 9 }).map((_, i) => (
        <mesh key={i} position={[0, h / 2 - 0.08 - i * 0.075, 0.06]} rotation={[0.9, 0, 0]}><boxGeometry args={[w - 0.04, 0.055, 0.004]} /><Flat color="#EDEAE3" roughness={0.6} /></mesh>
      ))}
      {beam && (
        <mesh position={[0, -h / 2 - 0.2, 0.9]} rotation={[-1.05, 0, 0]} renderOrder={2}>
          <planeGeometry args={[w * 1.05, 2.2]} />
          <meshBasicMaterial map={bt} transparent opacity={sunset ? 0.28 : 0.2} depthWrite={false} color={sunset ? "#FFC58F" : "#FFFBEA"} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

/** Plafonnier (dalle lumineuse). */
export function CeilingPanel({ position, on = true, sunset }: { position: V3; on?: boolean; sunset: boolean }) {
  return (
    <group position={position}>
      <mesh><boxGeometry args={[1.2, 0.04, 0.6]} /><Flat color="#F4F4F2" /></mesh>
      <mesh position={[0, -0.022, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[1.1, 0.5]} /><meshBasicMaterial color={on ? (sunset ? "#FFE2BA" : "#FFFFFF") : "#DDDDDD"} toneMapped={false} /></mesh>
    </group>
  );
}

/** Affiche encadrée, dessinée dans le code. */
export function Poster({ position, rotationY = 0, w = 0.7, h = 0.95, bg, fg, title, sub }: { position: V3; rotationY?: number; w?: number; h?: number; bg: string; fg: string; title: string; sub?: string }) {
  const t = useMemo(() => posterTex(bg, fg, title, sub), [bg, fg, title, sub]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.012]}><boxGeometry args={[w + 0.06, h + 0.06, 0.02]} /><Flat color="#22222A" roughness={0.5} /></mesh>
      <mesh><planeGeometry args={[w, h]} /><meshStandardMaterial map={t} roughness={0.6} /></mesh>
    </group>
  );
}

/** Horloge murale. */
export function Clock({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.2, 0.2, 0.04, 32]} /><Flat color="#FFFFFF" roughness={0.4} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.005]}><torusGeometry args={[0.2, 0.018, 8, 32]} /><Flat color="#1B1B22" /></mesh>
      {Array.from({ length: 12 }).map((_, i) => <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.16, Math.cos((i / 12) * Math.PI * 2) * 0.16, 0.022]}><boxGeometry args={[0.012, 0.03, 0.005]} /><Flat color="#1B1B22" /></mesh>)}
      <mesh position={[0.03, 0.04, 0.026]} rotation={[0, 0, -0.7]}><boxGeometry args={[0.014, 0.12, 0.005]} /><Flat color="#1B1B22" /></mesh>
      <mesh position={[-0.05, 0.02, 0.028]} rotation={[0, 0, 1.2]}><boxGeometry args={[0.01, 0.16, 0.005]} /><Flat color="#C93A18" /></mesh>
    </group>
  );
}

/** Radiateur. */
export function Radiator({ position, rotationY = 0, w = 1 }: { position: V3; rotationY?: number; w?: number }) {
  const n = Math.round(w / 0.08);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: n }).map((_, i) => <mesh key={i} position={[-w / 2 + i * 0.08 + 0.04, 0.42, 0]} castShadow><boxGeometry args={[0.05, 0.55, 0.08]} /><Flat color="#F2F2EF" roughness={0.4} /></mesh>)}
    </group>
  );
}

/** Plante en pot (deux formes). */
export function Plant({ position, kind = "leafy", scale = 1, pot = "#C8694F" }: { position: V3; kind?: "leafy" | "tall"; scale?: number; pot?: string }) {
  let seed = Math.round(position[0] * 13 + position[2] * 7);
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.15, 0.4, 16]} /><Flat color={pot} roughness={0.7} /></mesh>
      <mesh position={[0, 0.39, 0]}><cylinderGeometry args={[0.18, 0.18, 0.02, 16]} /><Flat color="#4A3527" /></mesh>
      {kind === "leafy"
        ? Array.from({ length: 9 }).map((_, k) => {
            const a = (k / 9) * Math.PI * 2 + rnd(), r = 0.12 + rnd() * 0.12;
            return <mesh key={k} position={[Math.cos(a) * r, 0.62 + rnd() * 0.35, Math.sin(a) * r]} rotation={[rnd() - 0.5, a, 0.6 + rnd() * 0.5]} scale={[0.24, 0.04, 0.14]} castShadow><sphereGeometry args={[1, 10, 8]} /><Flat color={k % 2 ? "#3C7A4B" : "#4E8F5C"} /></mesh>;
          })
        : Array.from({ length: 7 }).map((_, k) => <mesh key={k} position={[Math.cos(k) * 0.08, 0.75 + (k % 3) * 0.12, Math.sin(k) * 0.08]} rotation={[Math.cos(k * 2) * 0.35, k, Math.sin(k * 2) * 0.35]} castShadow><coneGeometry args={[0.06, 0.8, 5]} /><Flat color="#3F7A4E" flat /></mesh>)}
    </group>
  );
}

/** Écran d'ordinateur avec contenu dessiné. */
export function Monitor({ position, rotationY = 0, tex, w = 0.62, h = 0.38 }: { position: V3; rotationY?: number; tex: THREE.Texture; w?: number; h?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h / 2 + 0.1, 0]} castShadow><boxGeometry args={[w + 0.04, h + 0.04, 0.03]} /><Flat color="#1A1B21" roughness={0.4} /></mesh>
      <mesh position={[0, h / 2 + 0.1, 0.017]}><planeGeometry args={[w, h]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <mesh position={[0, 0.05, -0.02]}><boxGeometry args={[0.04, 0.1, 0.04]} /><Flat color="#1A1B21" /></mesh>
      <mesh position={[0, 0.005, 0]}><boxGeometry args={[0.2, 0.01, 0.14]} /><Flat color="#1A1B21" /></mesh>
      {/* clavier + souris */}
      <mesh position={[0, 0.008, 0.26]}><boxGeometry args={[0.42, 0.016, 0.13]} /><Flat color="#E9E7E2" roughness={0.5} /></mesh>
      <mesh position={[0.3, 0.012, 0.27]}><boxGeometry args={[0.06, 0.02, 0.1]} /><Flat color="#E9E7E2" roughness={0.5} /></mesh>
    </group>
  );
}

/** Bureau (plateau bois + piètement), dimensions réglables. */
export function Table({ position, rotationY = 0, w = 1.4, d = 0.7, h = 0.74, top = "#D2B48C", legs = "#2B2B31", wood = true }: { position: V3; rotationY?: number; w?: number; d?: number; h?: number; top?: string; legs?: string; wood?: boolean }) {
  const wt = useMemo(() => woodTex([1, 1], 128), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, h, 0]} castShadow receiveShadow><boxGeometry args={[w, 0.04, d]} />{wood ? <TexMat tex={wt} color={top} bump={0.004} rough={0.6} /> : <Flat color={top} roughness={0.5} />}</mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * (w / 2 - 0.05), h / 2, sz * (d / 2 - 0.05)]} castShadow><boxGeometry args={[0.04, h, 0.04]} /><Flat color={legs} roughness={0.4} /></mesh>)}
      <Blob position={[0, 0, 0]} size={[w * 1.25, d * 1.4]} opacity={0.45} />
    </group>
  );
}

/** Chaise (assise + dossier + pieds tube). */
export function Seat({ position, rotationY = 0, color = "#2F3340", shell = false }: { position: V3; rotationY?: number; color?: string; shell?: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.44, 0.04, 0.42]} /><Flat color={color} roughness={shell ? 0.4 : 0.8} /></mesh>
      <mesh position={[0, 0.72, -0.2]} rotation={[-0.12, 0, 0]} castShadow><boxGeometry args={[0.42, 0.42, 0.03]} /><Flat color={color} roughness={shell ? 0.4 : 0.8} /></mesh>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * 0.19, 0.22, sz * 0.18]}><cylinderGeometry args={[0.012, 0.012, 0.44, 6]} /><Flat color="#2B2B31" roughness={0.3} /></mesh>)}
      <Blob position={[0, 0, 0]} size={[0.7, 0.7]} opacity={0.35} />
    </group>
  );
}

/** Pile de livres / cahier ouvert / trousse sur une table. */
export function DeskClutter({ position, rotationY = 0, seed = 1 }: { position: V3; rotationY?: number; seed?: number }) {
  const cols = ["#C93A18", "#2A4BD7", "#F5B942", "#3AA95A", "#6D4C9F"];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[-0.2, 0.012, 0]} rotation={[0, 0.1 * seed, 0]}><boxGeometry args={[0.32, 0.012, 0.23]} /><Flat color="#FBFAF6" roughness={0.9} /></mesh>
      <mesh position={[-0.2, 0.02, 0]} rotation={[0, 0.1 * seed, 0]}><boxGeometry args={[0.005, 0.004, 0.22]} /><Flat color="#BDB8AE" /></mesh>
      {[0, 1, 2].map((k) => <mesh key={k} position={[0.22, 0.02 + k * 0.03, -0.05]} rotation={[0, 0.2 * k * seed, 0]} castShadow><boxGeometry args={[0.2, 0.028, 0.27]} /><Flat color={cols[(k + seed) % cols.length]} /></mesh>)}
      <mesh position={[0.02, 0.025, 0.14]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 0.18, 10]} /><Flat color={cols[(seed + 3) % cols.length]} /></mesh>
    </group>
  );
}

/* ─────────────────────────── Tennis ─────────────────────────── */

export function TennisCourtHD({ width, length, color, lineColor = "#F4F1EA" }: { width: number; length: number; color: string; lineColor?: string }) {
  const ct = useMemo(() => clayTex([width / 2.2, length / 2.2]), [width, length]);
  const net = useMemo(() => meshAlpha([28, 4]), []);
  const L = (w: number, d: number, x: number, z: number) => (
    <mesh position={[x, 0.018, z]} receiveShadow><boxGeometry args={[w, 0.006, d]} /><Flat color={lineColor} roughness={0.7} /></mesh>
  );
  const hw = width / 2 - 0.25, hl = length / 2 - 0.25, sw = hw * 0.78;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow><planeGeometry args={[width, length]} /><TexMat tex={ct} color={color} bump={0.02} rough={0.95} /></mesh>
      {/* Lignes (bandes de 5 cm) */}
      {L(width - 0.5, 0.05, 0, hl)}{L(width - 0.5, 0.05, 0, -hl)}
      {L(0.05, length - 0.5, hw, 0)}{L(0.05, length - 0.5, -hw, 0)}
      {L(0.05, length - 0.5, sw, 0)}{L(0.05, length - 0.5, -sw, 0)}
      {L(sw * 2, 0.05, 0, hl * 0.54)}{L(sw * 2, 0.05, 0, -hl * 0.54)}
      {L(0.05, hl * 1.08, 0, 0)}
      {/* Filet : mailles + bande blanche + sangle centrale + poteaux */}
      <mesh position={[0, 0.47, 0]}><planeGeometry args={[width - 0.1, 0.88]} /><meshStandardMaterial color="#1E1F24" alphaMap={net} transparent side={THREE.DoubleSide} roughness={1} depthWrite={false} /></mesh>
      <mesh position={[0, 0.9, 0]} castShadow><boxGeometry args={[width - 0.1, 0.07, 0.025]} /><Flat color="#F7F7F4" /></mesh>
      <mesh position={[0, 0.46, 0]}><boxGeometry args={[0.05, 0.88, 0.02]} /><Flat color="#F7F7F4" /></mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (width / 2 - 0.02), 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.04, 0.04, 1.0, 12]} /><Flat color="#2E5A3F" roughness={0.4} /></mesh>
          <mesh position={[0, 1.01, 0]}><sphereGeometry args={[0.045, 12, 8]} /><Flat color="#2E5A3F" /></mesh>
        </group>
      ))}
    </group>
  );
}

export function UmpireChair({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * 0.28, 0.9, sz * 0.28]} rotation={[sz * 0.08, 0, -sx * 0.08]} castShadow><cylinderGeometry args={[0.025, 0.03, 1.8, 8]} /><Flat color="#2E5A3F" roughness={0.4} /></mesh>)}
      {[0.5, 1.0].map((y) => <mesh key={y} position={[0, y, 0.3]}><boxGeometry args={[0.58, 0.03, 0.03]} /><Flat color="#2E5A3F" /></mesh>)}
      <mesh position={[0, 1.8, 0]} castShadow><boxGeometry args={[0.6, 0.06, 0.55]} /><Flat color="#2E5A3F" /></mesh>
      <mesh position={[0, 2.1, -0.25]} castShadow><boxGeometry args={[0.6, 0.55, 0.05]} /><Flat color="#2E5A3F" /></mesh>
      <mesh position={[0, 2.25, -0.22]}><planeGeometry args={[0.5, 0.12]} /><Flat color="#F4F1EA" /></mesh>
      <Blob position={[0, 0, 0]} size={[1.1, 1.1]} opacity={0.4} />
    </group>
  );
}

export function BallBasket({ position }: { position: V3 }) {
  let seed = 5;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return (
    <group position={position}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => <mesh key={i} position={[sx * 0.18, 0.35, sz * 0.18]}><cylinderGeometry args={[0.012, 0.012, 0.7, 6]} /><Flat color="#2A2A30" /></mesh>)}
      <mesh position={[0, 0.72, 0]}><boxGeometry args={[0.42, 0.34, 0.42]} /><meshStandardMaterial color="#2A2A30" alphaMap={meshAlpha([4, 3])} transparent side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {Array.from({ length: 22 }).map((_, i) => <mesh key={i} position={[(rnd() - 0.5) * 0.34, 0.6 + rnd() * 0.3, (rnd() - 0.5) * 0.34]}><sphereGeometry args={[0.035, 10, 8]} /><Flat color="#D7F03B" roughness={0.9} /></mesh>)}
      <Blob position={[0, 0, 0]} size={[0.8, 0.8]} opacity={0.35} />
    </group>
  );
}

export function CourtBench({ position, rotationY = 0, towel = "#C93A18" }: { position: V3; rotationY?: number; towel?: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {[-0.7, 0.7].map((x) => <mesh key={x} position={[x, 0.22, 0]}><boxGeometry args={[0.05, 0.44, 0.38]} /><Flat color="#2A2A30" /></mesh>)}
      <mesh position={[0, 0.46, 0]} castShadow><boxGeometry args={[1.6, 0.05, 0.4]} /><Flat color="#E9E4DA" /></mesh>
      <mesh position={[-0.4, 0.5, 0]} castShadow><boxGeometry args={[0.45, 0.03, 0.3]} /><Flat color={towel} /></mesh>
      <mesh position={[0.35, 0.62, 0]} castShadow><cylinderGeometry args={[0.035, 0.035, 0.24, 12]} /><Flat color="#9CC8E8" roughness={0.3} /></mesh>
      <mesh position={[0.5, 0.52, 0]} castShadow><boxGeometry args={[0.55, 0.12, 0.22]} /><Flat color="#1E2F55" /></mesh>
      <Blob position={[0, 0, 0]} size={[2, 0.8]} opacity={0.35} />
    </group>
  );
}

/** Grillage + bâche pare-vent autour d'un court (un côté). */
export function CourtFence({ position, rotationY = 0, length, sunset, label }: { position: V3; rotationY?: number; length: number; sunset: boolean; label?: string }) {
  const m = useMemo(() => meshAlpha([length * 5, 12], true), [length]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.5, 0]}><planeGeometry args={[length, 3]} /><meshStandardMaterial color="#2C3A33" alphaMap={m} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} /></mesh>
      <mesh position={[0, 0.7, 0.01]} receiveShadow><planeGeometry args={[length, 1.4]} /><Flat color={sunset ? "#1E3A2C" : "#24503A"} roughness={1} /></mesh>
      {label && <Text position={[0, 0.72, 0.02]} fontSize={0.26} color="#F4F1EA" letterSpacing={0.3} anchorX="center" anchorY="middle">{label}</Text>}
      {Array.from({ length: Math.round(length / 2.5) + 1 }).map((_, i) => <mesh key={i} position={[-length / 2 + i * 2.5, 1.5, 0]} castShadow><cylinderGeometry args={[0.035, 0.035, 3, 8]} /><Flat color="#2C3A33" /></mesh>)}
      <mesh position={[0, 3, 0]}><boxGeometry args={[length, 0.04, 0.04]} /><Flat color="#2C3A33" /></mesh>
    </group>
  );
}

/* ─────────────────────────── Football ─────────────────────────── */

export function PitchHD({ width, length, color, sunset }: { width: number; length: number; color: string; sunset: boolean }) {
  const gt = useMemo(() => grassTex([1, length / 2.4], true), [length]);
  const line = sunset ? "#EDE6DA" : "#FAFAF6";
  const L = (w: number, d: number, x: number, z: number) => <mesh position={[x, 0.02, z]}><boxGeometry args={[w, 0.004, d]} /><Flat color={line} roughness={0.8} /></mesh>;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} receiveShadow><planeGeometry args={[width, length]} /><TexMat tex={gt} color={color} bump={0.01} rough={0.95} /></mesh>
      {/* Bordures, ligne médiane côté chemin, surface de réparation côté but (x négatif) */}
      {L(0.06, length - 0.4, -width / 2 + 0.2, 0)}{L(0.06, length - 0.4, width / 2 - 0.2, 0)}
      {L(width - 0.4, 0.06, 0, -length / 2 + 0.2)}{L(width - 0.4, 0.06, 0, length / 2 - 0.2)}
      {L(0.06, 5.4, -width / 2 + 2.6, 0)}{L(2.4, 0.06, -width / 2 + 1.4, 2.7)}{L(2.4, 0.06, -width / 2 + 1.4, -2.7)}
      {L(0.06, 2.8, -width / 2 + 1.2, 0)}{L(1.0, 0.06, -width / 2 + 0.7, 1.4)}{L(1.0, 0.06, -width / 2 + 0.7, -1.4)}
      <mesh position={[-width / 2 + 1.9, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.07, 16]} /><Flat color={line} /></mesh>
      <mesh position={[-width / 2 + 2.6, 0.021, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}><ringGeometry args={[1.0, 1.06, 32, 1, 0, Math.PI]} /><Flat color={line} /></mesh>
      <mesh position={[width / 2 - 0.2, 0.021, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}><ringGeometry args={[1.5, 1.56, 40, 1, 0, Math.PI]} /><Flat color={line} /></mesh>
    </group>
  );
}

export function GoalHD({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const net = useMemo(() => meshAlpha([30, 12]), []);
  const netS = useMemo(() => meshAlpha([8, 12]), []);
  const netT = useMemo(() => meshAlpha([30, 8]), []);
  const W = 3.66, H = 1.8, D = 1.2;
  const post = (p: V3, a: [number, number, number, number], r: V3 = [0, 0, 0]) => <mesh position={p} rotation={r} castShadow><cylinderGeometry args={a} /><Flat color="#FAFAF6" roughness={0.35} /></mesh>;
  const netMat = (m: THREE.Texture) => <meshStandardMaterial color="#F4F4F0" alphaMap={m} transparent side={THREE.DoubleSide} depthWrite={false} roughness={1} />;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {post([-W / 2, H / 2, 0], [0.05, 0.05, H, 12])}
      {post([W / 2, H / 2, 0], [0.05, 0.05, H, 12])}
      {post([0, H, 0], [0.05, 0.05, W + 0.1, 12], [0, 0, Math.PI / 2])}
      {/* Armature arrière */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * W / 2, H * 0.5, -D / 2]} rotation={[0.55, 0, 0]}><cylinderGeometry args={[0.018, 0.018, Math.hypot(H, D), 6]} /><Flat color="#C9C9C4" /></mesh>)}
      {/* Filets : fond incliné, côtés, toit */}
      <mesh position={[0, H / 2, -D / 2]} rotation={[0.58, 0, 0]}><planeGeometry args={[W, Math.hypot(H, D)]} />{netMat(net)}</mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * W / 2, H / 2, -D / 2]} rotation={[0, Math.PI / 2, 0]}>
          <shapeGeometry args={[(() => { const sh = new THREE.Shape(); sh.moveTo(-D / 2, -H / 2); sh.lineTo(D / 2, -H / 2); sh.lineTo(D / 2, H / 2); sh.lineTo(-D / 2, -H / 2 + 0.01); return sh; })()]} />
          {netMat(netS)}
        </mesh>
      ))}
      <mesh position={[0, H, -0.25]} rotation={[-Math.PI / 2 + 0.2, 0, 0]}><planeGeometry args={[W, 0.5]} />{netMat(netT)}</mesh>
      <Blob position={[0, 0, -0.3]} size={[W + 0.6, 1.6]} opacity={0.3} />
    </group>
  );
}

export function CornerFlag({ position, color = "#F2C01E" }: { position: V3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.75, 0]} castShadow><cylinderGeometry args={[0.015, 0.015, 1.5, 6]} /><Flat color="#FAFAF6" /></mesh>
      <mesh position={[0.14, 1.36, 0]} rotation={[0, 0, 0]}><planeGeometry args={[0.28, 0.2]} /><meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.8} /></mesh>
    </group>
  );
}

export function Cone({ position, color = "#F27E2B" }: { position: V3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow><coneGeometry args={[0.09, 0.24, 16]} /><Flat color={color} roughness={0.6} /></mesh>
      <mesh position={[0, 0.01, 0]}><boxGeometry args={[0.22, 0.02, 0.22]} /><Flat color={color} /></mesh>
    </group>
  );
}

/** Ballon de foot à panneaux (icosaèdre bicolore). */
export function Football({ position, r = 0.11 }: { position: V3; r?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(r, 1).toNonIndexed();
    const cols: number[] = [];
    const c1 = new THREE.Color("#FAFAF6"), c2 = new THREE.Color("#1B1B22");
    const pos = g.getAttribute("position");
    for (let i = 0; i < pos.count; i += 3) {
      const dark = (i / 3) % 5 === 0;
      const c = dark ? c2 : c1;
      for (let k = 0; k < 3; k++) cols.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    return g;
  }, [r]);
  return <mesh geometry={geo} position={[position[0], position[1] + r, position[2]]} castShadow><meshStandardMaterial vertexColors flatShading roughness={0.5} /></mesh>;
}

export function Dugout({ position, rotationY = 0, sunset }: { position: V3; rotationY?: number; sunset: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.0, -0.4]} castShadow receiveShadow><boxGeometry args={[2.6, 2.0, 0.06]} /><Flat color={sunset ? "#8C9AA6" : "#B7C6D3"} roughness={0.3} /></mesh>
      <mesh position={[0, 2.0, 0]} rotation={[0.12, 0, 0]} castShadow><boxGeometry args={[2.7, 0.05, 0.95]} /><meshStandardMaterial color="#CFE3F2" transparent opacity={0.55} roughness={0.2} /></mesh>
      {[-1.3, 1.3].map((x) => <mesh key={x} position={[x, 1.0, 0]}><boxGeometry args={[0.05, 2.0, 0.85]} /><meshStandardMaterial color="#CFE3F2" transparent opacity={0.45} roughness={0.2} /></mesh>)}
      {[-0.8, -0.27, 0.27, 0.8].map((x) => <Seat key={x} position={[x, 0, -0.15]} color="#1E4FB0" shell />)}
      <Blob position={[0, 0, 0]} size={[3.2, 1.4]} opacity={0.4} />
    </group>
  );
}

/* ─────────────────────────── Salles ─────────────────────────── */

export function ChalkboardHD({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  const t = useMemo(() => chalkboardTex(), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.55, -0.02]}><boxGeometry args={[3.4, 1.6, 0.06]} /><Flat color="#8A6A48" /></mesh>
      <mesh position={[0, 1.55, 0.012]}><planeGeometry args={[3.2, 1.4]} /><meshStandardMaterial map={t} roughness={0.95} /></mesh>
      <mesh position={[0, 0.72, 0.07]}><boxGeometry args={[3.2, 0.04, 0.12]} /><Flat color="#8A6A48" /></mesh>
      {[-0.9, -0.5, 0.2].map((x, i) => <mesh key={x} position={[x, 0.75, 0.08]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.01, 0.01, 0.08, 6]} /><Flat color={["#FFFFFF", "#F5B942", "#F4A6A6"][i]} /></mesh>)}
      <mesh position={[0.9, 0.765, 0.08]}><boxGeometry args={[0.14, 0.04, 0.05]} /><Flat color="#3A2C22" /></mesh>
    </group>
  );
}

export function Lockers({ position, rotationY = 0, n = 5, color = "#3E6FB0" }: { position: V3; rotationY?: number; n?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[(i - (n - 1) / 2) * 0.42, 0, 0]}>
          <mesh position={[0, 0.95, 0]} castShadow receiveShadow><boxGeometry args={[0.4, 1.9, 0.45]} /><Flat color={color} roughness={0.45} /></mesh>
          {[1.55, 1.48, 1.41].map((y) => <mesh key={y} position={[0, y, 0.228]}><boxGeometry args={[0.24, 0.02, 0.005]} /><Flat color="#1E2A3F" /></mesh>)}
          <mesh position={[0.13, 1.0, 0.232]}><boxGeometry args={[0.025, 0.12, 0.02]} /><Flat color="#D9D9D4" roughness={0.3} /></mesh>
        </group>
      ))}
      <Blob position={[0, 0, 0.1]} size={[n * 0.42 + 0.4, 0.9]} opacity={0.4} />
    </group>
  );
}

export function BinderShelf({ position, rotationY = 0, w = 1.8 }: { position: V3; rotationY?: number; w?: number }) {
  const cols = ["#2E5FA8", "#C93A18", "#2E7D5B", "#E0A52A", "#1E2F55", "#8C8C94"];
  let seed = 9;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.0, -0.17]} castShadow receiveShadow><boxGeometry args={[w, 2.0, 0.03]} /><Flat color="#F2EFE8" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * w / 2, 1.0, 0]}><boxGeometry args={[0.03, 2.0, 0.36]} /><Flat color="#F2EFE8" /></mesh>)}
      {[0.02, 0.52, 1.02, 1.52, 1.98].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[w, 0.03, 0.36]} /><Flat color="#F2EFE8" /></mesh>)}
      {[0.04, 0.54, 1.04, 1.54].map((y, r) => Array.from({ length: Math.floor((w - 0.1) / 0.075) }).map((_, i) => {
        if (rnd() < 0.12) return null;
        const c = cols[Math.floor(rnd() * cols.length)];
        return (
          <group key={`${r}-${i}`} position={[-w / 2 + 0.08 + i * 0.075, y + 0.16, 0.02]} rotation={[0, 0, rnd() < 0.08 ? 0.2 : 0]}>
            <mesh castShadow><boxGeometry args={[0.065, 0.32, 0.29]} /><Flat color={c} roughness={0.5} /></mesh>
            <mesh position={[0, 0.04, 0.146]}><boxGeometry args={[0.045, 0.08, 0.002]} /><Flat color="#FFFFFF" /></mesh>
            <mesh position={[0, -0.08, 0.146]}><cylinderGeometry args={[0.012, 0.012, 0.002, 10]} /><Flat color="#FFFFFF" /></mesh>
          </group>
        );
      }))}
    </group>
  );
}

export function Printer({ position, rotationY = 0 }: { position: V3; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.6, 0.9, 0.55]} /><Flat color="#5A5D66" roughness={0.5} /></mesh>
      <mesh position={[0, 1.05, 0]} castShadow><boxGeometry args={[0.62, 0.3, 0.58]} /><Flat color="#EDEBE6" roughness={0.4} /></mesh>
      <mesh position={[0, 1.21, 0.05]}><boxGeometry args={[0.5, 0.02, 0.4]} /><Flat color="#2B2D33" /></mesh>
      <mesh position={[0.18, 1.18, 0.26]} rotation={[-0.4, 0, 0]}><boxGeometry args={[0.16, 0.08, 0.01]} /><meshBasicMaterial color="#7FB6FF" toneMapped={false} /></mesh>
      <mesh position={[0, 0.93, 0.25]}><boxGeometry args={[0.3, 0.012, 0.2]} /><Flat color="#FFFFFF" /></mesh>
      <Blob position={[0, 0, 0]} size={[1, 0.9]} opacity={0.4} />
    </group>
  );
}

export function WaterCooler({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.32, 1.0, 0.32]} /><Flat color="#F2F2EF" roughness={0.4} /></mesh>
      <mesh position={[0, 1.25, 0]} castShadow><cylinderGeometry args={[0.15, 0.15, 0.5, 20]} /><meshStandardMaterial color="#8FC4EA" transparent opacity={0.75} roughness={0.1} /></mesh>
      <mesh position={[0.08, 0.78, 0.17]}><boxGeometry args={[0.04, 0.05, 0.03]} /><Flat color="#3E7BD6" /></mesh>
      <mesh position={[-0.08, 0.78, 0.17]}><boxGeometry args={[0.04, 0.05, 0.03]} /><Flat color="#C93A18" /></mesh>
      <Blob position={[0, 0, 0]} size={[0.7, 0.7]} opacity={0.4} />
    </group>
  );
}

export function Whiteboard({ position, rotationY = 0, accent }: { position: V3; rotationY?: number; accent: string }) {
  const t = useMemo(() => dashboardTex(accent), [accent]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 1.6, -0.02]}><boxGeometry args={[2.9, 1.5, 0.05]} /><Flat color="#1A1B21" roughness={0.3} /></mesh>
      <mesh position={[0, 1.6, 0.008]}><planeGeometry args={[2.8, 1.4]} /><meshBasicMaterial map={t} toneMapped={false} /></mesh>
    </group>
  );
}

export function Beanbag({ position, color }: { position: V3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} scale={[0.5, 0.3, 0.5]} castShadow><sphereGeometry args={[1, 20, 14]} /><Flat color={color} roughness={0.95} /></mesh>
      <mesh position={[0, 0.42, -0.2]} scale={[0.42, 0.28, 0.25]} castShadow><sphereGeometry args={[1, 16, 12]} /><Flat color={color} roughness={0.95} /></mesh>
      <Blob position={[0, 0, 0]} size={[1.3, 1.3]} opacity={0.4} />
    </group>
  );
}

export const screens = { spreadsheet: spreadsheetTex, code: codeTex };
export { plasterTex, woodTex };
