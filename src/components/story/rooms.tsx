"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter, Palette } from "@/lib/story";
import { hotspots } from "@/lib/hotspots";
import { scroll } from "@/lib/scroll-progress";
import { Flat } from "./materials";
import { Bookshelf, Chair, Chalkboard, Desk, Goal, Lamp, Laptop, ProjectCard, SoccerBall, TennisBall, TennisCourt, Tree } from "./props";

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
function DoorWall({ z, wid, h, color, accent, distanceRef, doorAt }: { z: number; wid: number; h: number; color: string; accent: string; distanceRef: React.MutableRefObject<number>; doorAt: number }) {
  const left = useRef<THREE.Group>(null), right = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const d = distanceRef.current - doorAt;
    const open = d > -2.4 && d < 2.4;
    const target = open ? Math.PI * 0.55 : 0;
    if (left.current) left.current.rotation.y += (-target - left.current.rotation.y) * Math.min(1, dt * 3);
    if (right.current) right.current.rotation.y += (target - right.current.rotation.y) * Math.min(1, dt * 3);
  });
  const leftW = wid - DOOR_W - 1.5; // du bord gauche de la porte au bord gauche de la dalle
  return (
    <group position={[0, 0, z]}>
      <mesh position={[-DOOR_W / 2 - leftW / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[leftW, h, 0.3]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[DOOR_W / 2 + 0.75, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, h, 0.3]} />
        <Flat color={color} />
      </mesh>
      <mesh position={[0, (h + 2.3) / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[DOOR_W, h - 2.3, 0.3]} />
        <Flat color={color} />
      </mesh>
      {[[-1, left], [1, right]].map(([s, ref]) => (
        <group key={String(s)} ref={ref as React.RefObject<THREE.Group>} position={[(s as number) * (DOOR_W / 2), 0, 0]}>
          <mesh position={[-(s as number) * (DOOR_W / 4), 1.15, 0]} castShadow>
            <boxGeometry args={[DOOR_W / 2 - 0.02, 2.3, 0.06]} />
            <Flat color={accent} roughness={0.6} />
          </mesh>
        </group>
      ))}
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
  const img = tex.image as { width: number; height: number } | undefined;
  const ratio = img ? img.height / img.width : 0.66;
  return (
    <group>
      {bg && <mesh position={[0, 0, -0.02]}><planeGeometry args={[width + 0.3, width * ratio + 0.3]} /><Flat color={bg} /></mesh>}
      <mesh><planeGeometry args={[width, width * ratio]} /><meshBasicMaterial map={tex} transparent toneMapped={false} /></mesh>
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
        <sphereGeometry args={[0.45, 8, 8]} />
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
            <Flat color={palette.wall} />
          </mesh>
          <mesh position={[-wid + DOOR_W / 2 + 0.32, h - 0.35, 0]}>
            <boxGeometry args={[0.04, 0.1, len + 1.0]} />
            <Flat color={a} emissive={a} emissiveIntensity={0.5} />
          </mesh>
          {/* Murs d'entrée et de sortie, percés */}
          <DoorWall z={-(len + 1.2) / 2 + 0.15} wid={wid + 1.5} h={h} color={palette.wall} accent={a} distanceRef={distanceRef} doorAt={chapter.at - 0.45} />
          <DoorWall z={(len + 1.2) / 2 - 0.15} wid={wid + 1.5} h={h} color={palette.wall} accent={a} distanceRef={distanceRef} doorAt={chapter.at + chapter.length + 0.45} />
          {/* Sol intérieur un ton plus clair */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.005, 0]} receiveShadow>
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
          <group position={[-3.8, 0, 0]}><TennisCourt width={5.5} length={len - 1} color={sunset ? "#2E6A4A" : "#3F8F63"} /></group>
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
          <Sign image="/logos/concertae.png" position={[L + 0.03, 2.35, 0.2]} rotation={[0, Math.PI / 2, 0]} width={3.2} bg="#FFFFFF" />
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
          <Sign image="/logos/indysigner.webp" position={[L + 0.03, 2.25, 0.4]} rotation={[0, Math.PI / 2, 0]} width={1.3} />
          <Text position={[L + 0.04, 1.35, 0.4]} rotation={[0, Math.PI / 2, 0]} fontSize={0.2} color={a} anchorX="center" anchorY="middle" letterSpacing={0.25}>INDYSIGNER</Text>
          <Desk position={[-4.4, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} top="#2A2830" legs="#15141B" />
          <Laptop position={[-4.4, 0.78, 1.0]} rotation={[0, Math.PI / 2 + 0.3, 0]} accent={a} />
          <Chair position={[-3.5, 0, 1.0]} rotation={[0, Math.PI / 2, 0]} color="#15141B" />
          {/* Lit */}
          <mesh position={[L + 1.1, 0.25, -2.6]} castShadow receiveShadow><boxGeometry args={[1.6, 0.5, 2.2]} /><Flat color="#3B3944" /></mesh>
          <mesh position={[L + 1.1, 0.56, -2.6]} castShadow><boxGeometry args={[1.5, 0.12, 2.0]} /><Flat color={a} /></mesh>
          <mesh position={[L + 1.1, 0.62, -3.4]}><boxGeometry args={[1.2, 0.14, 0.5]} /><Flat color="#F5F1EA" /></mesh>
          {["indysigner.fr", "lovive.fr", "manikalab.com", "nayumatea.com"].map((s, i) => (
            <ProjectCard key={s} position={[-3.2 + (i % 2) * 1.2, 1.6 + Math.floor(i / 2) * 0.9, -3.2 + (i % 2) * 0.5]} label={s} accent={a} active={active} />
          ))}
          {/* Affiche prospection sur le mur gauche */}
          <mesh position={[L + 0.03, 1.9, 3.6]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[1.3, 0.9]} /><Flat color="#15141B" emissive={a} emissiveIntensity={0.15} /></mesh>
          <Text position={[L + 0.05, 1.9, 3.6]} rotation={[0, Math.PI / 2, 0]} fontSize={0.12} color={a} anchorX="center" anchorY="middle" maxWidth={1.1} textAlign="center">n8n · Shopify · Klaviyo</Text>
          <Lamp position={[-4.0, 2.9, 0.4]} color={a} intensity={active ? 12 : 4} />
        </group>
      );
    case "albert":
      return (
        <group>
          <Sign image="/logos/albert-x-mines.webp" position={[L + 0.03, 2.2, 1.0]} rotation={[0, Math.PI / 2, 0]} width={2.8} bg="#FFFFFF" />
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

/** Quai de gare + train à l'arrêt, panneau MILANO : posé entre la chambre et Albert School. */
export function Station({ curve, at, sunset, accent }: { curve: THREE.Curve<THREE.Vector3>; at: number; sunset: boolean; accent: string }) {
  const f = useMemo(() => frameAt(curve, at), [curve, at]);
  const body = sunset ? "#B23A2C" : "#C9432F";
  return (
    <group position={f.p} quaternion={f.q}>
      {/* Quai (à droite du chemin, côté caméra le train reste lisible) */}
      <mesh position={[-2.2, 0.18, 0]} receiveShadow><boxGeometry args={[4.4, 0.36, 12]} /><Flat color={sunset ? "#A39B8E" : "#CFC8BB"} /></mesh>
      <mesh position={[-0.1, 0.37, 0]}><boxGeometry args={[0.12, 0.02, 12]} /><Flat color={accent} /></mesh>
      {/* Train */}
      <group position={[-6.2, 0, 0]}>
        <mesh position={[0, 1.55, 0]} castShadow receiveShadow><boxGeometry args={[2.8, 2.4, 11]} /><Flat color={body} roughness={0.7} /></mesh>
        <mesh position={[0, 2.8, 0]} castShadow><boxGeometry args={[2.6, 0.2, 10.6]} /><Flat color="#2A2A2E" /></mesh>
        {[-4, -2, 0, 2, 4].map((z) => <mesh key={z} position={[1.41, 1.9, z]}><boxGeometry args={[0.02, 0.8, 1.3]} /><Flat color="#BFDDF3" emissive="#BFDDF3" emissiveIntensity={sunset ? 0.5 : 0.1} /></mesh>)}
        <mesh position={[1.41, 1.1, 0]}><boxGeometry args={[0.02, 0.12, 10.6]} /><Flat color="#F5F1EA" /></mesh>
        {[-3.5, 3.5].map((z) => [-0.9, 0.9].map((x) => <mesh key={`${z}${x}`} position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.45, 0.45, 0.25, 14]} /><Flat color="#2A2A2E" /></mesh>))}
      </group>
      {/* Panneau MILANO */}
      <group position={[-1.6, 0, -4.2]}>
        <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.04, 0.04, 2.8, 8]} /><Flat color="#2A2A2E" /></mesh>
        <mesh position={[0, 2.75, 0]} castShadow><boxGeometry args={[2.4, 0.6, 0.08]} /><Flat color="#1B2A5A" /></mesh>
        <Text position={[0, 2.75, 0.05]} fontSize={0.3} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={0.18}>MILANO</Text>
        <Text position={[0, 2.75, -0.05]} rotation={[0, Math.PI, 0]} fontSize={0.3} color="#FFFFFF" anchorX="center" anchorY="middle" letterSpacing={0.18}>MILANO</Text>
      </group>
      <Lamp position={[-1.0, 3.2, 3]} color="#FFF3DD" intensity={sunset ? 8 : 2} />
    </group>
  );
}
