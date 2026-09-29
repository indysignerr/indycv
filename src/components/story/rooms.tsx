"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter, Palette } from "@/lib/story";
import { hotspots } from "@/lib/hotspots";
import { scroll } from "@/lib/scroll-progress";
import { Flat } from "./materials";
import { Bed, BigDesk, Bookshelf, Carpet, Chair, Chalkboard, Desk, Goal, Lamp, Laptop, LegoShelf, Parquet, ProjectCard, SoccerBall, TennisBall, TennisCourt, Tree } from "./props";

const up = new THREE.Vector3(0, 1, 0);
export const DOOR_W = 2.2;
export const ROOM_W = 11;

/** Repère local du chemin à la distance d (Z local = sens de marche, X local = droite). */
export function frameAt(curve: THREE.Curve<THREE.Vector3>, d: number) {
  const u = THREE.MathUtils.clamp(d / curve.getLength(), 0, 1);
  const p = curve.getPointAt(u), t = curve.getTangentAt(u);
  const s = new THREE.Vector3().crossVectors(up, t).normalize();
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(t, new THREE.Vector3(), up));
  return { p, t, s, q };
}

const CLOSED = new Set(["lycee", "concertae", "indysigner", "albert"]);

/** Mur transversal percé d'une porte (le chemin passe en x=0), avec deux battants qui s'ouvrent à l'approche. */
function DoorWall({ z, wid, h, color, accent }: { z: number; wid: number; h: number; color: string; accent: string; distanceRef?: React.MutableRefObject<number>; doorAt?: number }) {
  // Mur transversal qui s'arrête 1,6 m avant le chemin + portique coloré centré sur le chemin
  const end = -1.6;
  const start = -wid + DOOR_W / 2 + 0.75 - 0.0;
  const w = end - start;
  return (
    <group position={[0, 0, z]}>
      <mesh position={[start + w / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, 0.3]} />
        <Flat color={color} />
      </mesh>
      {/* Portique : deux montants + linteau */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (DOOR_W / 2), 1.3, 0]} castShadow><boxGeometry args={[0.16, 2.6, 0.2]} /><Flat color={accent} roughness={0.6} /></mesh>
      ))}
      <mesh position={[0, 2.6, 0]} castShadow><boxGeometry args={[DOOR_W + 0.16, 0.16, 0.2]} /><Flat color={accent} roughness={0.6} /></mesh>
    </group>
  );
}

/** Enseigne : logo (image) ou texte, posé sur le mur du fond ou le mur gauche. */
function Sign({ image, text, position, rotation, width = 2.4, color = "#F5F1EA", bg }: { image?: string; text?: string; position: [number, number, number]; rotation: [number, number, number]; width?: number; color?: string; bg?: string }) {
  return (
    <group position={position} rotation={rotation}>
      {image ? <LogoPlane url={image} width={width} bg={bg} /> : (
        <Text fontSize={0.28} color={color} anchorX="center" anchorY="middle" maxWidth={width} textAlign="center" letterSpacing={0.08}>{text}</Text>
      )}
    </group>
  );
}

function LogoPlane({ url, width, bg }: { url: string; width: number; bg?: string }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const img = tex.image as { width: number; height: number } | undefined;
  const ratio = img ? img.height / img.width : 0.66;
  const h = width * ratio;
  return (
    <group>
      {/* Affiche : fond papier + cadre fin, image non éclairée pour garder les couleurs du logo */}
      <mesh position={[0, 0, -0.05]}><boxGeometry args={[width + 0.36, h + 0.36, 0.05]} /><Flat color="#1F1E24" roughness={0.6} /></mesh>
      <mesh position={[0, 0, -0.015]}><planeGeometry args={[width + 0.2, h + 0.2]} /><meshBasicMaterial color={bg ?? "#F7F3EC"} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.01]}><planeGeometry args={[width, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} /></mesh>
    </group>
  );
}

/** Point cliquable : anneau qui pulse, ouvre une fiche HTML. */
export function HotspotMarker({ id, position, accent }: { id: string; position: [number, number, number]; accent: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.12 + (hover ? 0.25 : 0);
    ring.current.scale.setScalar(s);
    ring.current.lookAt(ring.current.position.clone().add(new THREE.Vector3(1, 0.3, 0.6)));
  });
  return (
    <group position={position}>
      <mesh ref={ring}
        onClick={(e) => { e.stopPropagation(); scroll.hotspot = scroll.hotspot === id ? null : id; }}
        onPointerOver={() => { setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        <ringGeometry args={[0.13, 0.19, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.95} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh><sphereGeometry args={[0.07, 12, 12]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
      {/* Zone de clic large */}
      <mesh onClick={(e) => { e.stopPropagation(); scroll.hotspot = scroll.hotspot === id ? null : id; }} onPointerOver={() => { setHover(true); document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Diorama : dalle, mur gauche, mur du fond (devant) et mur d'entrée (derrière) percés d'une porte pour les pièces fermées.
 * Ouvert côté droit (caméra). Le chemin passe en x=0, la pièce s'étend vers -x.
 */
export function Diorama({ curve, chapter, palette, active, sunset, distanceRef }: { curve: THREE.Curve<THREE.Vector3>; chapter: Chapter; palette: Palette; active: boolean; sunset: boolean; distanceRef: React.MutableRefObject<number> }) {
  const mid = chapter.at + chapter.length / 2;
  const f = useMemo(() => frameAt(curve, mid), [curve, mid]);
  const len = chapter.length, wid = ROOM_W, h = 3.4;
  const closed = CLOSED.has(chapter.id);
  const a = palette.accent;
  const cx = -wid / 2 + DOOR_W / 2 + 0.75; // centre de la dalle (la pièce déborde un peu à droite du chemin)
  return (
    <group position={f.p} quaternion={f.q}>
      <mesh position={[cx, -0.12, 0]} receiveShadow>
        <boxGeometry args={[wid + 1.5, 0.24, len + 1.2]} />
        <Flat color={palette.floor} />
      </mesh>
      {closed && (
        <>
          {/* Mur gauche */}
          <mesh position={[-wid + DOOR_W / 2 + 0.15, h / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, h, len + 1.2]} />
            <Flat color={chapter.id === "indysigner" ? (sunset ? "#1B3E30" : "#1F4D3A") : palette.wall} roughness={chapter.id === "lycee" ? 1 : 0.85} />
          </mesh>
          <mesh position={[-wid + DOOR_W / 2 + 0.32, h - 0.35, 0]}>
            <boxGeometry args={[0.04, 0.1, len + 1.0]} />
            <Flat color={a} emissive={a} emissiveIntensity={0.5} />
          </mesh>
          {/* Murs d'entrée et de sortie, percés */}
          <DoorWall z={-(len + 1.2) / 2 + 0.15} wid={wid} h={h} color={palette.wall} accent={a} />
          <DoorWall z={(len + 1.2) / 2 - 0.15} wid={wid} h={h} color={palette.wall} accent={a} />
          {/* Sol intérieur un ton plus clair */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.015, 0]} receiveShadow>
            <planeGeometry args={[wid + 1.2, len + 0.9]} />
            <Flat color={palette.floor} />
          </mesh>
        </>
      )}
      <Contents chapter={chapter} palette={palette} active={active} sunset={sunset} len={len} wid={wid} />
      {hotspots.filter((hs) => hs.chapter === chapter.id).map((hs) => (
        <HotspotMarker key={hs.id} id={hs.id} position={hs.position} accent={a} />
      ))}
    </group>
  );
}

function Contents({ chapter, palette, active, sunset, len, wid }: { chapter: Chapter; palette: Palette; active: boolean; sunset: boolean; len: number; wid: number }) {
  const a = palette.accent;
  const L = -wid + DOOR_W / 2 + 0.3; // face intérieure du mur gauche
  const F = (len + 1.2) / 2 - 0.3; // face intérieure du mur du fond (devant)
  switch (chapter.id) {
    case "tennis":
      return (
        <group>
          <group position={[-3.8, 0, 0]}><TennisCourt width={5.5} length={len - 1} color={sunset ? "#9E4F2C" : "#C2673B"} /></group>
          <TennisBall position={[-0.9, 0.07, 1.6]} />
          <mesh position={[-3.8, 0.55, len / 2 + 0.2]}><boxGeometry args={[6.5, 1.1, 0.04]} /><meshStandardMaterial color="#DDE6DF" transparent opacity={0.35} roughness={1} /></mesh>
          <Tree position={[L + 1.4, 0, -len / 2 + 1]} scale={1.2} color={sunset ? "#4C8A5A" : "#5FA86A"} />
          <Tree position={[L + 2.6, 0, len / 2 - 0.5]} scale={0.9} color={sunset ? "#4C8A5A" : "#6DB57A"} />
        </group>
      );
    case "foot":
      return (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.01, 0]} receiveShadow><planeGeometry args={[6, len]} /><Flat color={sunset ? "#3E8546" : "#4CA455"} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.02, 0]}><ringGeometry args={[1.1, 1.16, 32]} /><Flat color="#F4F4F2" /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.02, 0]}><planeGeometry args={[0.06, len]} /><Flat color="#F4F4F2" /></mesh>
          <Goal position={[L + 1.6, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
          <SoccerBall position={[-0.8, 0.13, 0.8]} />
          <Tree position={[L + 1.0, 0, len / 2 + 0.4]} scale={1.1} color={sunset ? "#4C8A5A" : "#5FA86A"} />
        </group>
      );
    case "lycee":
      return (
        <group>
          <Carpet length={len + 0.5} color={sunset ? "#26407F" : "#2F4FB5"} />
          <Sign text="LYCÉE SIMONE VEIL" position={[L + 0.02, 2.66, 0.4]} rotation={[0, Math.PI / 2, 0]} width={5} color={a} />
          <Chalkboard position={[L + 0.25, 0, 0.4]} rotation={[0, Math.PI / 2, 0]} accent={a} />
          {[-2.4, -0.8, 0.8].map((z, i) => (
            <group key={i}>
              <Desk position={[-4.6, 0, z]} rotation={[0, Math.PI / 2, 0]} top={sunset ? "#B08E68" : "#D2B48C"} />
              <Chair position={[-3.75, 0, z]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ))}
          <Lamp position={[-4.0, 2.9, 0]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
    case "concertae":
      return (
        <group>
          <group position={[cxOf(wid), 0, 0]}><Parquet width={wid + 1.2} length={len + 0.5} color={sunset ? "#9A7A56" : "#C9A57A"} dark={sunset ? "#80654A" : "#B08D63"} /></group>
          <Sign image="/logos/concertae.png" position={[L + 0.06, 2.3, 0.2]} rotation={[0, Math.PI / 2, 0]} width={2.8} bg="#FFFFFF" />
          <Desk position={[-4.4, 0, -1.6]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#8C7458" : "#B79A7C"} />
          <Chair position={[-3.5, 0, -1.6]} rotation={[0, Math.PI / 2, 0]} />
          <Desk position={[-4.4, 0, 1.2]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#8C7458" : "#B79A7C"} />
          <Chair position={[-3.5, 0, 1.2]} rotation={[0, Math.PI / 2, 0]} />
          <Bookshelf position={[-2.0, 0, F - 0.2]} books={[a, "#E9E4D6", "#2A4BD7", "#F5B942", "#C9C4BA"]} />
          <Lamp position={[-3.2, 2.9, -2.6]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
    case "indysigner":
      return (
        <group>
          <group position={[cxOf(wid), 0, 0]}><Parquet width={wid + 1.2} length={len + 0.5} color={sunset ? "#B39873" : "#E6D1AE"} dark={sunset ? "#A08664" : "#D5BD96"} /></group>
          {/* Tapis rond au centre */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.05, -0.2]} receiveShadow><circleGeometry args={[1.6, 40]} /><Flat color={sunset ? "#D9CBB5" : "#EFE6D6"} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.055, -0.2]}><ringGeometry args={[1.35, 1.45, 40]} /><Flat color={a} /></mesh>
          {/* Mur vert : bureau 3 écrans sous le logo */}
          <Sign image="/logos/indysigner.webp" position={[L + 0.06, 2.5, -1.9]} rotation={[0, Math.PI / 2, 0]} width={1.9} bg="#F4EFE6" />
          <BigDesk position={[L + 0.55, 0, -1.9]} rotation={[0, Math.PI / 2, 0]} accent={a} top={sunset ? "#8E7658" : "#D9BE94"} />
          <Chair position={[L + 1.45, 0, -1.9]} rotation={[0, -Math.PI / 2, 0]} color="#1E2A3F" />
          {/* Mur vert : placard à Legos */}
          <LegoShelf position={[L + 0.3, 0, 1.6]} rotation={[0, Math.PI / 2, 0]} />
          {/* Mur du fond (blanc) : fenêtre + grand lit double + table de nuit */}
          {/* Fenêtre sur le mur du fond (face tournée vers la pièce) */}
          <group position={[-4.6, 2.15, F - 0.02]} rotation={[0, Math.PI, 0]}>
            <mesh position={[0, 0, -0.03]}><boxGeometry args={[2.1, 1.3, 0.06]} /><Flat color="#FFFFFF" /></mesh>
            <mesh position={[0, 0, 0.005]}><planeGeometry args={[1.9, 1.1]} /><meshBasicMaterial color={sunset ? "#F2A26B" : "#BFDDF3"} toneMapped={false} /></mesh>
            <mesh position={[0, 0, 0.012]}><boxGeometry args={[0.05, 1.1, 0.02]} /><Flat color="#FFFFFF" /></mesh>
            <mesh position={[0, 0, 0.012]}><boxGeometry args={[1.9, 0.05, 0.02]} /><Flat color="#FFFFFF" /></mesh>
          </group>
          <Bed position={[-4.6, 0, F - 1.25]} rotation={[0, Math.PI, 0]} accent="#1E2F55" frame={sunset ? "#8C7456" : "#B8966B"} />
          <group position={[-3.2, 0, F - 0.4]}>
            <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.5, 0.56, 0.45]} /><Flat color={sunset ? "#8C7456" : "#B8966B"} /></mesh>
            <mesh position={[0, 0.66, 0]}><cylinderGeometry args={[0.07, 0.1, 0.2, 12]} /><Flat color="#F4F1EA" /></mesh>
            <mesh position={[0, 0.84, 0]}><coneGeometry args={[0.16, 0.2, 16, 1, true]} /><Flat color={a} emissive="#FFD9A0" emissiveIntensity={sunset ? 0.6 : 0} /></mesh>
          </group>
          {/* Plante */}
          <group position={[-1.2, 0, F - 0.5]}>
            <mesh position={[0, 0.2, 0]} castShadow><cylinderGeometry args={[0.2, 0.16, 0.4, 14]} /><Flat color="#C8694F" /></mesh>
            {[0, 1, 2, 3, 4].map((k) => <mesh key={k} position={[Math.cos(k * 1.3) * 0.12, 0.65 + (k % 2) * 0.15, Math.sin(k * 1.3) * 0.12]} rotation={[Math.cos(k) * 0.4, k, Math.sin(k) * 0.4]} castShadow><coneGeometry args={[0.1, 0.6, 5]} /><Flat color="#3F7A4E" flat /></mesh>)}
          </group>
          <Lamp position={[-4.2, 2.95, -0.2]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
    case "albert":
      return (
        <group>
          <Carpet length={len + 0.5} color={sunset ? "#26407F" : "#2F4FB5"} />
          <Sign image="/logos/albert-x-mines.webp" position={[L + 0.06, 2.3, 1.0]} rotation={[0, Math.PI / 2, 0]} width={2.6} bg="#FFFFFF" />
          {[-3.0, -1.6].map((z, i) => <Bookshelf key={i} position={[L + 0.2, 0, z]} rotation={[0, Math.PI / 2, 0]} books={[a, "#E9E4D6", "#FF5A36", "#F5B942", "#5FA86A"]} />)}
          <Desk position={[-4.2, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} screen accent={a} top={sunset ? "#A79E90" : "#DCD6CA"} />
          <Chair position={[-3.35, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} />
          <Lamp position={[-4.0, 2.9, 0.2]} color={sunset ? "#FFD9A8" : "#FFF3DD"} intensity={active ? 10 : 3} />
        </group>
      );
  }
  return null;
}

const cxOf = (wid: number) => -wid / 2 + DOOR_W / 2 + 0.75;

