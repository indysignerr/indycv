"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { Flat } from "./materials";
import { brickTex, renderTex, romanTileTex, slateTex, stoneBaseTex } from "./textures";

/**
 * Bâtiments des pièces fermées : un vrai volume vu de dehors (façades texturées, fenêtres, toit, auvent, portes
 * coulissantes), et une pièce entièrement close vue de dedans (la caméra entre avec le personnage : plus d'extérieur).
 *
 * Repère local du diorama : Z = sens de marche, le chemin passe en x = 0, la pièce s'étend vers -x,
 * la caméra « intérieure » se place côté +x (entre le chemin et la façade avant).
 */

export const DOOR_W = 2.2;
export const DOOR_H = 2.6;
/** Faces intérieures : mur du fond (x0), mur avant côté caméra (x1). */
export const X0 = -9.6;
export const X1 = 5.4;
const T = 0.3;
/** Hauteur sous plafond et hauteur des murs extérieurs (jusqu'à l'égout du toit). */
export const H = 3.4;
const WH = H + 0.35;

type Roof = { kind: "gable"; pitch: number; tex: "tile" | "slate"; color: string } | { kind: "flat"; color: string };
export type BuildingStyle = {
  facade: "render" | "brick";
  wall: string;
  base?: string;
  roof: Roof;
  frame: string;
  shutters?: string;
  door: string;
  glass: { w: number; h: number };
};

export const STYLES: Record<string, BuildingStyle> = {
  // Lycée : enduit beige, soubassement de pierre, tuiles rouges
  lycee: { facade: "render", wall: "#E4D5B8", base: "#BDB3A3", roof: { kind: "gable", pitch: 0.5, tex: "tile", color: "#B65A3F" }, frame: "#F7F4EE", door: "#2E5FA8", glass: { w: 1.3, h: 1.7 } },
  // Cabinet à Cannes : enduit ocre, volets bleus, tuiles romaines, pente douce
  concertae: { facade: "render", wall: "#E6B48A", base: "#C9A07C", roof: { kind: "gable", pitch: 0.36, tex: "tile", color: "#C4683F" }, frame: "#FFFFFF", shutters: "#6E9CC6", door: "#2F5E7E", glass: { w: 1.1, h: 1.5 } },
  // La maison d'Indy : enduit crème, volets marine, ardoises, cheminée
  indysigner: { facade: "render", wall: "#F0E7D8", base: "#D6CAB5", roof: { kind: "gable", pitch: 0.62, tex: "slate", color: "#58626F" }, frame: "#FFFFFF", shutters: "#1D3A66", door: "#1D3A66", glass: { w: 1.1, h: 1.4 } },
  // Albert School : brique, grandes baies, toit-terrasse
  albert: { facade: "brick", wall: "#FFFFFF", roof: { kind: "flat", color: "#9A9C9F" }, frame: "#2B2D33", door: "#2B2D33", glass: { w: 2.0, h: 2.3 } },
};

/** Boîte dont les UV sont en mètres (les motifs gardent leur taille quelle que soit la dimension du mur). */
function metricBox(w: number, h: number, d: number, offU = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute("uv") as THREE.BufferAttribute;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // px, nx, py, ny, pz, nz
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) {
    const k = f * 4 + i;
    uv.setXY(k, uv.getX(k) * dims[f][0] + (f >= 4 ? offU : 0), uv.getY(k) * dims[f][1]);
  }
  uv.needsUpdate = true;
  return g;
}

const texMat = (tex: THREE.Texture, color: string, bump = 0.01, rough = 0.92) =>
  new THREE.MeshStandardMaterial({ map: tex, bumpMap: tex, bumpScale: bump, color, roughness: rough, metalness: 0, envMapIntensity: 0.5 });

/** Mur-boîte : une matière par face ([+x, -x, +y, -y, +z, -z]). */
function Slab({ size, position, mats, offU = 0, cast = false }: { size: [number, number, number]; position: [number, number, number]; mats: THREE.Material[]; offU?: number; cast?: boolean }) {
  const geo = useMemo(() => metricBox(size[0], size[1], size[2], offU), [size, offU]);
  return <mesh geometry={geo} position={position} material={mats} castShadow={cast} receiveShadow />;
}

/** Fenêtre de façade (la face extérieure regarde +z local) : encadrement, vitre (allumée au coucher de soleil), appui, volets. */
function FacadeWindow({ position, rotationY, w, h, frame, shutters, sunset, mullions = true }: { position: [number, number, number]; rotationY: number; w: number; h: number; frame: string; shutters?: string; sunset: boolean; mullions?: boolean }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, 0.02]}><boxGeometry args={[w + 0.16, h + 0.16, 0.06]} /><Flat color={frame} roughness={0.5} /></mesh>
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color={sunset ? "#5A4A3E" : "#3A4B5E"} emissive={sunset ? "#FFC27E" : "#000000"} emissiveIntensity={sunset ? 0.75 : 0} roughness={0.12} metalness={0.35} envMapIntensity={1.1} />
      </mesh>
      {mullions && <mesh position={[0, 0, 0.065]}><boxGeometry args={[0.05, h, 0.03]} /><Flat color={frame} /></mesh>}
      {mullions && <mesh position={[0, h * 0.18, 0.065]}><boxGeometry args={[w, 0.05, 0.03]} /><Flat color={frame} /></mesh>}
      <mesh position={[0, -h / 2 - 0.1, 0.12]}><boxGeometry args={[w + 0.3, 0.06, 0.24]} /><Flat color="#EDE7DD" /></mesh>
      {shutters && [-1, 1].map((s) => (
        <group key={s} position={[s * (w / 2 + 0.32), 0, 0.06]}>
          <mesh><boxGeometry args={[0.56, h + 0.1, 0.05]} /><Flat color={shutters} roughness={0.6} /></mesh>
          {Array.from({ length: 7 }).map((_, i) => <mesh key={i} position={[0, -h / 2 + 0.15 + i * (h / 7), 0.03]}><boxGeometry args={[0.5, 0.02, 0.012]} /><Flat color="#000000" roughness={1} /></mesh>)}
        </group>
      ))}
    </group>
  );
}

/** Portes coulissantes à deux vantaux (elles rentrent dans l'épaisseur du mur) : s'ouvrent quand le personnage ou la caméra approche. */
function SlidingDoor({ at, distanceRef, color }: { at: number; distanceRef: React.MutableRefObject<number>; color: string }) {
  const leaves = useRef<THREE.Group>(null);
  const open = useRef(0);
  useFrame(({ camera }, dt) => {
    const camD = -camera.position.z; // le chemin est droit, le long de -z monde
    const near = Math.min(Math.abs(distanceRef.current - at), Math.abs(camD - at));
    open.current += ((near < 2.6 ? 1 : 0) - open.current) * Math.min(1, dt * 5);
    const g = leaves.current;
    if (!g) return;
    const k = open.current * (DOOR_W / 2);
    g.children[0].position.x = -DOOR_W / 4 - k;
    g.children[1].position.x = DOOR_W / 4 + k;
  });
  const lw = DOOR_W / 2 - 0.1;
  return (
    <group ref={leaves}>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * DOOR_W / 4, 0, 0]}>
          <mesh position={[0, DOOR_H / 2 - 0.04, 0]} castShadow><boxGeometry args={[lw, DOOR_H - 0.1, 0.05]} /><Flat color={color} roughness={0.45} /></mesh>
          {/* hublot dépoli */}
          {[-1, 1].map((f) => <mesh key={f} position={[0, 1.6, f * 0.028]}><boxGeometry args={[lw * 0.55, 0.9, 0.004]} /><meshStandardMaterial color="#E6EEF2" roughness={0.3} emissive="#FFFFFF" emissiveIntensity={0.08} /></mesh>)}
          <mesh position={[-s * (lw / 2 - 0.12), 1.1, 0.04]}><boxGeometry args={[0.03, 0.4, 0.03]} /><Flat color="#D8D8D4" roughness={0.3} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Logo sur plaque (image) : fond clair, cadre fin. */
function LogoPlaque({ url, width, position, rotationY }: { url: string; width: number; position: [number, number, number]; rotationY: number }) {
  const tex = useTexture(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const img = tex.image as { width: number; height: number } | undefined;
  const h = width * (img ? img.height / img.width : 0.5);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0, -0.02]}><boxGeometry args={[width + 0.14, h + 0.14, 0.04]} /><Flat color="#C9A45C" roughness={0.35} /></mesh>
      <mesh position={[0, 0, 0.002]}><planeGeometry args={[width + 0.06, h + 0.06]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.006]}><planeGeometry args={[width, h]} /><meshBasicMaterial map={tex} transparent alphaTest={0.02} toneMapped={false} /></mesh>
    </group>
  );
}

/** Palmier stylisé (Cannes). */
function Palm({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={i} position={[i * 0.05, 0.45 + i * 0.75, 0]} rotation={[0, 0, -0.05]} castShadow><cylinderGeometry args={[0.13 - i * 0.012, 0.16 - i * 0.012, 0.78, 10]} /><Flat color={i % 2 ? "#8C6B4A" : "#7A5C3E"} /></mesh>
      ))}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[0.3 + Math.cos(a) * 0.7, 4.75, Math.sin(a) * 0.7]} rotation={[Math.sin(a) * 0.55, -a, Math.cos(a) * 0.55]} scale={[1.5, 0.05, 0.32]} castShadow>
            <sphereGeometry args={[0.6, 10, 6]} /><Flat color={i % 2 ? "#4E8F4A" : "#5FA35A"} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Drapeau français sur mât. */
function Flag({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 2.4, 0]} castShadow><cylinderGeometry args={[0.035, 0.045, 4.8, 8]} /><Flat color="#E8E8E4" roughness={0.3} /></mesh>
      {["#1F3F9A", "#F7F7F4", "#D8342B"].map((c, i) => (
        <mesh key={c} position={[0.12 + i * 0.3 + 0.15, 4.35, 0]}><boxGeometry args={[0.3, 0.6, 0.015]} /><Flat color={c} roughness={0.8} /></mesh>
      ))}
    </group>
  );
}

/**
 * L'enveloppe d'une pièce fermée. `len` = longueur de la pièce le long du chemin ; `mid` = sa distance sur le chemin.
 * Les portiques et plaques restent gérés par la pièce (DoorFrame) ; ici : murs, sol, plafond, toit, fenêtres, portes, abords.
 */
export function Building({ id, len, mid, distanceRef, sunset, interior, backInterior, sign }: {
  id: string;
  len: number;
  mid: number;
  distanceRef: React.MutableRefObject<number>;
  sunset: boolean;
  /** Matière des faces intérieures (murs d'entrée, de sortie, avant). */
  interior: THREE.Material;
  /** Matière de la face intérieure du mur du fond. */
  backInterior: THREE.Material;
  sign?: string;
}) {
  const st = STYLES[id];
  const Z = (len + 1.2) / 2 - T; // demi-longueur intérieure
  const Zo = Z + T;
  const facade = useMemo(() => (st.facade === "brick" ? texMat(brickTex(), st.wall, 0.02, 0.9) : texMat(renderTex(), st.wall, 0.008, 0.95)), [st]);
  const base = useMemo(() => (st.base ? texMat(stoneBaseTex(), st.base, 0.02, 0.95) : null), [st]);
  const fascia = useMemo(() => new THREE.MeshStandardMaterial({ color: "#EFE9DF", roughness: 0.7, envMapIntensity: 0.5 }), []);

  // Murs : [+x, -x, +y, -y, +z, -z]
  const back = [backInterior, facade, facade, facade, facade, facade];
  const front = [facade, interior, facade, facade, facade, facade];
  const entrance = [facade, facade, facade, facade, interior, facade];
  const exit = [facade, facade, facade, facade, facade, interior];
  const xs = { lw: -DOOR_W / 2 - X0, rw: X1 - DOOR_W / 2 };
  const doorWall = (z: number, mats: THREE.Material[]) => (
    <group position={[0, 0, z]}>
      <Slab size={[xs.lw, WH, T]} position={[X0 + xs.lw / 2, WH / 2, 0]} mats={mats} offU={X0} />
      <Slab size={[xs.rw, WH, T]} position={[DOOR_W / 2 + xs.rw / 2, WH / 2, 0]} mats={mats} offU={DOOR_W / 2} />
      <Slab size={[DOOR_W, WH - DOOR_H, T]} position={[0, DOOR_H + (WH - DOOR_H) / 2, 0]} mats={mats} offU={-DOOR_W / 2} />
    </group>
  );

  const roof = st.roof;
  const o = 0.45; // débord de toit
  const bx0 = X0 - T - o, bx1 = X1 + T + o, bw = bx1 - bx0, bcx = (bx0 + bx1) / 2;

  return (
    <group>
      {/* Murs */}
      <Slab size={[T, WH, 2 * Zo]} position={[X0 - T / 2, WH / 2, 0]} mats={back} />
      <Slab size={[T, WH, 2 * Zo]} position={[X1 + T / 2, WH / 2, 0]} mats={front} />
      {doorWall(-Z - T / 2, entrance)}
      {doorWall(Z + T / 2, exit)}

      {/* Soubassement de pierre (façades visibles : entrée et avant) */}
      {base && (
        <>
          <Slab size={[xs.lw + 0.02, 0.85, 0.04]} position={[X0 + xs.lw / 2, 0.425, -Zo - 0.02]} mats={[base, base, base, base, base, base]} offU={X0} />
          <Slab size={[xs.rw + T, 0.85, 0.04]} position={[DOOR_W / 2 + (xs.rw + T) / 2, 0.425, -Zo - 0.02]} mats={[base, base, base, base, base, base]} offU={DOOR_W / 2} />
          <Slab size={[0.04, 0.85, 2 * Zo + 0.08]} position={[X1 + T + 0.02, 0.425, 0]} mats={[base, base, base, base, base, base]} />
        </>
      )}

      {/* Fenêtres : façade d'entrée (regarde -z) et façade avant (regarde +x) */}
      {(st.facade === "brick" ? [-7.9, -5.0, 3.4] : [-8.2, -5.9, -3.6, 3.3]).map((x) => (
        <FacadeWindow key={`e${x}`} position={[x, st.glass.h > 2 ? 1.55 : 1.75, -Zo - 0.02]} rotationY={Math.PI} w={st.glass.w} h={st.glass.h} frame={st.frame} shutters={st.shutters} sunset={sunset} mullions={st.facade !== "brick"} />
      ))}
      {[-2.6, 2.6].map((z) => (
        <FacadeWindow key={`f${z}`} position={[X1 + T + 0.02, st.glass.h > 2 ? 1.55 : 1.75, z]} rotationY={Math.PI / 2} w={st.glass.w} h={st.glass.h} frame={st.frame} shutters={st.shutters} sunset={sunset} mullions={st.facade !== "brick"} />
      ))}

      {/* Auvent au-dessus de l'entrée */}
      <group position={[0, 3.22, -Zo - 0.45]}>
        <mesh castShadow><boxGeometry args={[DOOR_W + 0.9, 0.08, 0.9]} /><Flat color={st.frame === "#2B2D33" ? "#2B2D33" : "#F4F1EA"} roughness={0.5} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * (DOOR_W / 2 + 0.35), -0.22, 0.3]} rotation={[0.9, 0, 0]}><boxGeometry args={[0.04, 0.5, 0.04]} /><Flat color="#3A3A40" /></mesh>)}
      </group>
      {/* Applique lumineuse (allumée le soir) */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (DOOR_W / 2 + 0.55), 2.3, -Zo - 0.03]}>
          <mesh><boxGeometry args={[0.2, 0.36, 0.04]} /><Flat color="#2B2B31" roughness={0.4} /></mesh>
          <mesh position={[0, 0.02, -0.08]}><boxGeometry args={[0.13, 0.24, 0.12]} /><meshStandardMaterial color="#FFF1D6" emissive="#FFD49A" emissiveIntensity={sunset ? 1.7 : 0.2} roughness={0.3} /></mesh>
          <mesh position={[0, 0.15, -0.08]}><boxGeometry args={[0.17, 0.03, 0.15]} /><Flat color="#2B2B31" roughness={0.4} /></mesh>
        </group>
      ))}

      {/* Portes coulissantes (entrée, sortie) */}
      <group position={[0, 0, -Z - T / 2]}><SlidingDoor at={mid - Z - T / 2} distanceRef={distanceRef} color={st.door} /></group>
      <group position={[0, 0, Z + T / 2]}><SlidingDoor at={mid + Z + T / 2} distanceRef={distanceRef} color={st.door} /></group>

      {/* Toit */}
      {roof.kind === "gable" ? <GableRoof x0={bx0} x1={bx1} zo={Zo} o={o} pitch={roof.pitch} tex={roof.tex} color={roof.color} facade={facade} fascia={fascia} chimney={id === "indysigner"} /> : (
        <group>
          <mesh position={[(X0 - T + X1 + T) / 2, WH + 0.1, 0]} receiveShadow><boxGeometry args={[X1 - X0 + 2 * T + 0.1, 0.2, 2 * Zo + 0.1]} /><meshStandardMaterial map={renderTex()} color={roof.color} roughness={1} /></mesh>
          {/* Acrotère (parapet) en brique + couvertine */}
          {[[X0 - T + 0.1, 0, 0.2, 2 * Zo], [X1 + T - 0.1, 0, 0.2, 2 * Zo], [(X0 + X1) / 2, -Zo + 0.1, X1 - X0 + 2 * T, 0.2], [(X0 + X1) / 2, Zo - 0.1, X1 - X0 + 2 * T, 0.2]].map(([x, z, w, d], i) => (
            <group key={i}>
              <Slab size={[w, 0.75, d]} position={[x, WH + 0.55, z]} mats={[facade, facade, facade, facade, facade, facade]} />
              <mesh position={[x, WH + 0.95, z]}><boxGeometry args={[w + 0.06, 0.06, d + 0.08]} /><Flat color="#D9D6D0" roughness={0.5} /></mesh>
            </group>
          ))}
          {/* Groupes de ventilation */}
          {[[-6.5, 1.5], [-3.2, -1.8]].map(([x, z], i) => <mesh key={i} position={[x, WH + 0.6, z]} castShadow><boxGeometry args={[1.4, 0.8, 1.0]} /><Flat color="#B9BCC0" roughness={0.5} /></mesh>)}
        </group>
      )}

      {/* Enseignes et abords, propres à chaque lieu */}
      {id === "lycee" && (
        <>
          <Text position={[-5.6, 3.05, -Zo - 0.04]} rotation={[0, Math.PI, 0]} fontSize={0.38} letterSpacing={0.12} color="#1E2F55" anchorX="center" anchorY="middle" material-side={THREE.FrontSide}>LYCÉE SIMONE VEIL</Text>
          <Flag position={[-2.6, 0, -Zo - 1.1]} />
        </>
      )}
      {id === "concertae" && (
        <>
          <LogoPlaque url="/logos/concertae.png" width={1.1} position={[-2.3, 1.75, -Zo - 0.04]} rotationY={Math.PI} />
          <Palm position={[-3.4, 0, -Zo - 1.4]} />
        </>
      )}
      {id === "indysigner" && (
        <>
          <LogoPlaque url="/logos/indysigner.webp" width={0.62} position={[1.85, 1.65, -Zo - 0.04]} rotationY={Math.PI} />
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 1.75, 0, -Zo - 0.5]}>
              <mesh position={[0, 0.25, 0]} castShadow><cylinderGeometry args={[0.24, 0.18, 0.5, 14]} /><Flat color="#C46D56" roughness={0.7} /></mesh>
              <mesh position={[0, 0.75, 0]} castShadow><icosahedronGeometry args={[0.36, 1]} /><Flat color="#4E8F5C" flat /></mesh>
            </group>
          ))}
        </>
      )}
      {id === "albert" && (
        <Text position={[-4.2, WH + 0.55, -Zo - 0.02]} rotation={[0, Math.PI, 0]} fontSize={0.5} letterSpacing={0.16} color="#FFFFFF" anchorX="center" anchorY="middle" material-side={THREE.FrontSide} outlineWidth={0.012} outlineColor="#1E2F55">ALBERT SCHOOL</Text>
      )}
      {sign && null}
    </group>
  );
}

/** Toit à deux pans (faîtage parallèle à la façade d'entrée), pignons maçonnés, bandeaux d'égout ; cheminée en option. */
function GableRoof({ x0, x1, zo, o, pitch, tex, color, facade, fascia, chimney }: { x0: number; x1: number; zo: number; o: number; pitch: number; tex: "tile" | "slate"; color: string; facade: THREE.Material; fascia: THREE.Material; chimney: boolean }) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  const rise = zo * Math.tan(pitch);
  const slope = (zo + o) / Math.cos(pitch);
  const top = useMemo(() => texMat(tex === "tile" ? romanTileTex() : slateTex(), color, 0.03, 0.85), [tex, color]);
  const under = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E7DFD2", roughness: 0.8 }), []);
  const mats = [under, under, top, under, under, under];
  const slabGeo = useMemo(() => metricBox(w, 0.14, slope), [w, slope]);
  const yMid = WH + (rise - o * Math.tan(pitch)) / 2;
  const gable = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-zo, 0); s.lineTo(zo, 0); s.lineTo(0, rise); s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
  }, [zo, rise]);
  return (
    <group>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={slabGeo} material={mats} position={[cx, yMid + 0.07, s * (zo + o) / 2]} rotation={[s * pitch, 0, 0]} castShadow receiveShadow />
      ))}
      {/* Pignons (avant et fond) */}
      <mesh geometry={gable} material={facade} position={[X1, WH, 0]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={gable} material={facade} position={[X0 - T, WH, 0]} rotation={[0, Math.PI / 2, 0]} />
      {/* Bandeaux d'égout */}
      {[-1, 1].map((s) => <mesh key={s} position={[cx, WH - o * Math.tan(pitch) - 0.02, s * (zo + o - 0.02)]} material={fascia}><boxGeometry args={[w, 0.16, 0.05]} /></mesh>)}
      {chimney && (
        <group position={[x1 - 3.2, WH + rise * 0.55, zo * 0.42]}>
          <mesh castShadow><boxGeometry args={[0.6, 1.9, 0.6]} /><Flat color="#C46D56" roughness={0.8} /></mesh>
          <mesh position={[0, 0.97, 0]}><boxGeometry args={[0.72, 0.08, 0.72]} /><Flat color="#6B6B70" /></mesh>
        </group>
      )}
    </group>
  );
}
