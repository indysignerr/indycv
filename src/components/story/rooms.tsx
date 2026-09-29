"use client";

import { memo, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, Text, useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { Chapter, Palette } from "@/lib/story";
import { hotspots } from "@/lib/hotspots";
import { scroll } from "@/lib/scroll-progress";
import type { Lang } from "@/lib/content";
import { Flat } from "./materials";
import { Building, DOOR_W, X0, X1 } from "./building";
import { CLAY_COOL, CLAY_WARM, Figure, Racket } from "./figures";
import { Bed, Laptop, LegoShelf, TennisBall, Tree } from "./props";
import {
  Badge, BallBasket, Baseboard, Beanbag, BinderShelf, Blob, ChalkboardHD, Clock, CornerFlag, Cone, CourtBench, CourtFence, CeilingPanel, DeskClutter, Dugout,
  Football, GoalHD, Lockers, Monitor, PipelineBoard, PitchHD, Plant, Poster, Printer, Radiator, Seat, Table, TennisCourtHD, TexMat, UmpireChair, WallAO, WaterCooler, Whiteboard, Window, screens,
} from "./detail";
import { carpetTex, clayTex, concreteTex, plasterTex, tileTex, woodTex } from "./textures";

const up = new THREE.Vector3(0, 1, 0);
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

/** Voile de lumière tendu dans l'encadrement d'un portique : rayons verticaux doux, additif, à la couleur du lieu. */
function veilMaterial(color: string) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 uColor; uniform float uIntensity; uniform float uTime; varying vec2 vUv;
      void main(){
        float edge = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x) * smoothstep(1.0, 0.72, vUv.y);
        float rays = 0.62 + 0.38 * sin(vUv.x * 31.0 + uTime * 0.7) * sin(vUv.x * 11.0 - uTime * 0.45 + vUv.y * 2.0);
        float a = edge * rays * mix(1.0, 0.45, vUv.y) * uIntensity;
        gl_FragColor = linearToOutputTexel(vec4(mix(uColor, vec3(1.0), 0.35), a));
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false, fog: false,
  });
}

/**
 * Encadrement de porte coloré (le chemin passe en x=0) : montants et linteau qui débordent des deux faces du mur,
 * voile de lumière dans l'ouverture, plaque « 0X · NOM » en façade (côté `out` : -1 = vers -z, +1 = vers +z).
 * À l'approche, l'encadrement s'illumine ; le voile culmine juste avant le seuil puis s'efface quand on le traverse.
 */
function DoorFrame({ z, out, accent, label, at, distanceRef }: { z: number; out: 1 | -1; accent: string; label?: string; at: number; distanceRef: React.MutableRefObject<number> }) {
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.1, roughness: 0.55, metalness: 0, envMapIntensity: 0.55 }), [accent]);
  const veil = useMemo(() => veilMaterial(accent), [accent]);
  useFrame(({ clock }) => {
    const x = distanceRef.current - at;
    const near = Math.exp(-(x * x) / 9), cross = Math.exp(-(x * x) / 0.5);
    frame.emissiveIntensity = 0.05 + 0.38 * near;
    veil.uniforms.uIntensity.value = 0.42 * near * (1 - 0.85 * cross);
    veil.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <group position={[0, 0, z]}>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (DOOR_W / 2 + 0.02), 1.3, 0]} castShadow material={frame}><boxGeometry args={[0.2, 2.6, 0.42]} /></mesh>
      ))}
      <mesh position={[0, 2.62, 0]} castShadow material={frame}><boxGeometry args={[DOOR_W + 0.24, 0.2, 0.42]} /></mesh>
      <mesh position={[0, 1.26, 0]} material={veil} renderOrder={3}><planeGeometry args={[DOOR_W - 0.16, 2.5]} /></mesh>
      {label && (
        <group position={[0, 2.95, out * 0.24]}>
          <mesh castShadow material={frame}><boxGeometry args={[Math.max(DOOR_W + 0.16, label.length * 0.13 + 0.45), 0.4, 0.1]} /></mesh>
          <Text position={[0, -0.005, out * 0.055]} rotation={[0, out < 0 ? Math.PI : 0, 0]} fontSize={0.18} letterSpacing={0.14} color={inkOn(accent)} anchorX="center" anchorY="middle" material-side={THREE.FrontSide}>{label}</Text>
        </group>
      )}
    </group>
  );
}

/** Couleur de texte la plus lisible (encre ou blanc) sur un fond donné, au sens du contraste WCAG. */
function inkOn(bg: string) {
  const lum = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; // THREE.Color est linéaire
  const L = lum(new THREE.Color(bg));
  const dark = lum(new THREE.Color("#15141B"));
  return (L + 0.05) / (dark + 0.05) >= 1.05 / (L + 0.05) ? "#15141B" : "#FFFFFF";
}

/** Liseré en vague (signature du logo Indysigner) : un tube fin qui ondule le long du mur. */
function WaveStripe({ x, y, len, color }: { x: number; y: number; len: number; color: string }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const z = -len / 2 + (i / 80) * len;
      pts.push(new THREE.Vector3(x, y + Math.sin(z * 1.35 + 0.6) * 0.07 + Math.sin(z * 0.42) * 0.03, z));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.024, 6, false);
  }, [x, y, len]);
  return <mesh geometry={geo}><Flat color={color} emissive={color} emissiveIntensity={0.35} /></mesh>;
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

/** Point cliquable : noyau blanc, halo à la couleur du chapitre qui respire, étiquette au survol. */
export function HotspotMarker({ id, position, accent, label }: { id: string; position: [number, number, number]; accent: string; label: string }) {
  const halo = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hover, setHover] = useState(false);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + position[2];
    if (halo.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.12 + (hover ? 0.35 : 0);
      halo.current.scale.setScalar(s);
    }
    if (ring.current) {
      const k = (t * 0.6) % 1;
      ring.current.scale.setScalar(1 + k * 1.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.55;
    }
  });
  const toggle = (e: { stopPropagation: () => void }) => { e.stopPropagation(); scroll.hotspot = scroll.hotspot === id ? null : id; };
  return (
    <group position={position}>
      <Billboard>
        <mesh ref={ring} renderOrder={5}><ringGeometry args={[0.14, 0.16, 40]} /><meshBasicMaterial color="#FFFFFF" transparent depthWrite={false} toneMapped={false} /></mesh>
        <mesh ref={halo} renderOrder={5}><circleGeometry args={[0.2, 40]} /><meshBasicMaterial color={accent} transparent opacity={0.75} depthWrite={false} toneMapped={false} /></mesh>
      </Billboard>
      <mesh renderOrder={6}><sphereGeometry args={[0.07, 16, 16]} /><meshBasicMaterial color="#FFFFFF" toneMapped={false} /></mesh>
      <mesh onClick={toggle} onPointerOver={(e) => { e.stopPropagation(); setHover(true); scroll.cursor = "hotspot"; document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHover(false); scroll.cursor = ""; document.body.style.cursor = ""; }}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {hover && (
        <Html center position={[0, 0.34, 0]} style={{ pointerEvents: "none" }} zIndexRange={[15, 0]}>
          <span className="hotspot-tip">{label}</span>
        </Html>
      )}
    </group>
  );
}

/** Matière de sol par lieu. */
function floorTex(id: string, wid: number, len: number) {
  switch (id) {
    case "tennis": return clayTex([wid / 2.2, len / 2.2]);
    case "concertae": return woodTex([wid / 2.4, len / 2.4], 64);
    case "indysigner": return woodTex([wid / 3, len / 3], 80);
    case "lycee": case "albert": return concreteTex([wid / 4, len / 4]);
    default: return null;
  }
}

/**
 * Diorama : dalle texturée ; pour les pièces fermées, mur gauche (le mur « du fond » vu par la caméra),
 * murs d'entrée et de sortie percés d'un portique, plafond avec dalles lumineuses, plinthes et ombres d'angle.
 * Ouvert côté droit (caméra). Le chemin passe en x=0, la pièce s'étend vers -x.
 */
export const Diorama = memo(function Diorama({ curve, chapter, palette, sunset, distanceRef, lang }: { curve: THREE.Curve<THREE.Vector3>; chapter: Chapter; palette: Palette; sunset: boolean; distanceRef: React.MutableRefObject<number>; lang: Lang }) {
  const root = useRef<THREE.Group>(null);
  // Hors champ : la pièce n'est plus dessinée (ni ses ombres) quand le personnage est loin
  useFrame(() => {
    if (!root.current) return;
    const d = distanceRef.current - (chapter.at + chapter.length / 2);
    root.current.visible = d > -24 && d < 20;
  });
  const mid = chapter.at + chapter.length / 2;
  const f = useMemo(() => frameAt(curve, mid), [curve, mid]);
  const len = chapter.length, wid = ROOM_W, h = 3.4;
  const closed = CLOSED.has(chapter.id);
  const a = palette.accent;
  const cx = -wid / 2 + DOOR_W / 2 + 0.75; // centre de la dalle
  const ft = useMemo(() => floorTex(chapter.id, closed ? X1 - X0 + 0.6 : wid + 1.5, len + 1.2), [chapter.id, closed, wid, len]);
  const wallT = useMemo(() => plasterTex([4, 1.4], chapter.id === "lycee"), [chapter.id]);
  const ceilT = useMemo(() => tileTex([(X1 - X0) / 1.2, len / 1.2]), [len]);
  const Lx = X0; // face intérieure du mur du fond
  const leftColor = chapter.id === "indysigner" ? (sunset ? "#16305A" : "#1D3A66") : palette.wall;
  // Faces intérieures des murs : enduit teinté (mur du fond : sa couleur propre, granulé au lycée)
  const innerMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plasterTex([4, 1.4]), bumpMap: plasterTex([4, 1.4]), bumpScale: 0.004, color: palette.wall, roughness: 0.95, envMapIntensity: 0.55 }), [palette.wall]);
  const backMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wallT, bumpMap: wallT, bumpScale: chapter.id === "lycee" ? 0.012 : 0.004, color: leftColor, roughness: 0.95, envMapIntensity: 0.55 }), [wallT, leftColor, chapter.id]);
  return (
    <group ref={root} position={f.p} quaternion={f.q}>
      {/* Sol : la dalle de la pièce (étendue jusqu'au mur avant pour les pièces fermées) */}
      <mesh position={[closed ? (X0 - 0.3 + X1 + 0.3) / 2 : cx, -0.12, 0]} receiveShadow>
        <boxGeometry args={[closed ? X1 - X0 + 0.6 : wid + 1.5, 0.24, len + 1.2]} />
        {ft ? <TexMat tex={ft} color={palette.floor} bump={chapter.id === "tennis" ? 0.02 : 0.006} rough={chapter.id === "tennis" ? 0.95 : 0.7} /> : <Flat color={palette.floor} />}
      </mesh>
      {closed && (
        <>
          {/* Le bâtiment : façades, toit, fenêtres, portes coulissantes, abords */}
          <Building id={chapter.id} len={len} mid={mid} distanceRef={distanceRef} sunset={sunset} interior={innerMat} backInterior={backMat} />
          {chapter.id === "indysigner" ? <WaveStripe x={Lx + 0.03} y={h - 0.42} len={len + 1.0} color={a} /> : (
            <mesh position={[Lx + 0.02, h - 0.35, 0]}>
              <boxGeometry args={[0.04, 0.08, len + 1.0]} />
              <Flat color={a} emissive={a} emissiveIntensity={0.4} />
            </mesh>
          )}
          <Baseboard position={[Lx + 0.02, 0, 0]} length={len + 0.6} rotationY={Math.PI / 2} color={chapter.id === "indysigner" ? "#EFE8DC" : "#FFFFFF"} />
          <WallAO position={[Lx, 0, 0]} length={len + 0.6} rotationY={-Math.PI / 2} />
          <WallAO position={[X1, 0, 0]} length={len + 0.6} rotationY={Math.PI / 2} />
          {/* Encadrements des portes d'entrée et de sortie */}
          <DoorFrame z={-(len + 1.2) / 2 + 0.15} out={-1} at={mid - (len + 1.2) / 2 + 0.15} distanceRef={distanceRef} accent={a} label={signOf(chapter)} />
          <DoorFrame z={(len + 1.2) / 2 - 0.15} out={1} at={mid + (len + 1.2) / 2 - 0.15} distanceRef={distanceRef} accent={a} />
          {[-1, 1].map((sz) => [[X0, -DOOR_W / 2], [DOOR_W / 2, X1]].map(([xa, xb], i) => (
            <WallAO key={`${sz}${i}`} position={[(xa + xb) / 2, 0, sz * ((len + 1.2) / 2 - 0.3)]} length={xb - xa} rotationY={sz < 0 ? 0 : Math.PI} />
          )))}
          {/* Plafond + dalles lumineuses (sans ombre portée) */}
          <mesh position={[(X0 + X1) / 2, h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[X1 - X0, len + 0.6]} />
            <meshStandardMaterial map={ceilT} color={sunset ? "#CFC6B8" : "#E9E6E0"} emissive={sunset ? "#8A7560" : "#C9C6C0"} emissiveIntensity={0.55} roughness={1} side={THREE.DoubleSide} />
          </mesh>
          {[-2.6, 0, 2.6].filter((z) => Math.abs(z) < len / 2).map((z) => [-7.2, -4.2, -1.2, 1.8].map((x) => <CeilingPanel key={`${x}${z}`} position={[x, h - 0.03, z]} sunset={sunset} />))}
        </>
      )}
      <Contents chapter={chapter} palette={palette} sunset={sunset} len={len} wid={wid} />
      {hotspots.filter((hs) => hs.chapter === chapter.id).map((hs) => (
        <HotspotMarker key={hs.id} id={hs.id} position={hs.position} accent={a} label={hs.title[lang]} />
      ))}
    </group>
  );
});

function Contents({ chapter, palette, sunset, len, wid }: { chapter: Chapter; palette: Palette; sunset: boolean; len: number; wid: number }) {
  const a = palette.accent;
  const L = -wid + DOOR_W / 2 + 0.3; // face intérieure du mur gauche (≈ -9.6)
  const F = (len + 1.2) / 2 - 0.3; // face intérieure du mur de sortie
  const cx = cxOf(wid);
  const shT = useMemo(() => screens.spreadsheet(a), [a]);
  const cdT = useMemo(() => screens.code(a), [a]);
  const cpT = useMemo(() => carpetTex([1, len]), [len]);
  const carpet = (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
      <planeGeometry args={[1.9, len + 0.6]} />
      <TexMat tex={cpT} color={sunset ? "#2A4284" : "#3353B8"} bump={0.006} rough={1} />
    </mesh>
  );
  switch (chapter.id) {
    case "tennis":
      return (
        <group>
          <group position={[-4.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <TennisCourtHD width={5.4} length={8.4} color={sunset ? "#A5532E" : "#C8683A"} />
          </group>
          <CourtFence position={[L + 0.2, 0, 0]} rotationY={Math.PI / 2} length={len + 0.8} sunset={sunset} label="TENNIS CLUB · COURT 3" />
          {/* Grillage d'entrée : il s'arrête 1,6 m avant le chemin (le personnage passe à côté, jamais au travers) */}
          <CourtFence position={[-5.6, 0, -len / 2 - 0.2]} length={8.0} sunset={sunset} />
          <UmpireChair position={[-4.5, 0, 3.35]} rotationY={Math.PI} />
          {/* Figurants (scène de référence) : l'adversaire en fond de court, l'arbitre sur sa chaise */}
          <Figure clip="tennis-forehand" position={[-7.7, 0, 0.6]} rotationY={Math.PI / 2} hand={<Racket />} clockId="opponent" essential />
          <Figure clip="sit-idle" position={[-4.5, 1.33, 3.35]} rotationY={Math.PI} offset={0.4} />
          <CourtBench position={[-6.4, 0, 3.9]} rotationY={Math.PI} />
          <CourtBench position={[-2.6, 0, 3.9]} rotationY={Math.PI} towel="#2A4BD7" />
          <BallBasket position={[-1.2, 0, -2.6]} />
          {[[-2.2, 1.2], [-6.8, -1.9], [-3.1, -3.4], [-7.9, 2.6], [-1.5, 3.3]].map(([x, z], i) => <TennisBall key={i} position={[x, 0.07, z]} />)}
          <Tree position={[L - 1.2, 0, -len / 2 + 1]} scale={1.3} color={sunset ? "#4C8A5A" : "#5FA86A"} />
          <Tree position={[L - 1.5, 0, len / 2 - 1]} scale={1.1} color={sunset ? "#4C8A5A" : "#6DB57A"} />
        </group>
      );
    case "foot":
      return (
        <group>
          <group position={[cx, 0, 0]}><PitchHD width={wid + 1.4} length={len + 1.1} color={sunset ? "#4E8A45" : "#5DAA52"} sunset={sunset} /></group>
          <GoalHD position={[L + 0.95, 0, 0]} rotationY={Math.PI / 2} />
          <CornerFlag position={[L + 0.3, 0, -len / 2 - 0.25]} />
          <CornerFlag position={[L + 0.3, 0, len / 2 + 0.25]} />
          <Dugout position={[-5.2, 0, len / 2 + 0.2]} rotationY={Math.PI} sunset={sunset} />
          {/* Figurants : le gardien dans ses buts, un joueur qui fête un but, un autre qui cherche une passe, un remplaçant sur le banc */}
          <Figure clip="idle" position={[-8.1, 0, 0.2]} rotationY={Math.PI / 2} offset={0.2} essential />
          <Figure clip="celebrate" position={[-4.9, 0, -2.3]} rotationY={Math.PI / 2 + 0.35} tint={CLAY_WARM} scale={0.97} offset={0.5} />
          <Figure clip="look-around" position={[-6.3, 0, 2.5]} rotationY={Math.PI / 2 - 0.45} tint={CLAY_COOL} offset={0.3} />
          <Figure clip="sit-idle" position={[-5.47, 0, 5.35]} rotationY={Math.PI} scale={0.98} offset={0.7} />
          <Football position={[-1.4, 0, 0.9]} />
          <Football position={[-7.6, 0, -0.4]} r={0.105} />
          {[[-3, -2.8], [-3.8, -2.8], [-4.6, -2.8], [-5.4, -2.8]].map(([x, z], i) => <Cone key={i} position={[x, 0, z]} color={i % 2 ? "#F27E2B" : "#F2C01E"} />)}
          <Tree position={[L - 1.3, 0, len / 2 - 0.5]} scale={1.2} color={sunset ? "#4C8A5A" : "#5FA86A"} />
          <Tree position={[L - 1.1, 0, -len / 2 + 1.2]} scale={1} color={sunset ? "#4C8A5A" : "#6DB57A"} />
        </group>
      );
    case "lycee":
      return (
        <group>
          {carpet}
          <Text position={[L + 0.03, 2.66, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.22} color="#1E2F55" anchorX="center" anchorY="middle" letterSpacing={0.18}>LYCÉE SIMONE VEIL</Text>
          <ChalkboardHD position={[L + 0.03, 0, 0]} rotationY={Math.PI / 2} />
          <Clock position={[L + 0.04, 2.5, -2.2]} rotationY={Math.PI / 2} />
          {[-3.3, 3.3].map((z) => (
            <group key={z}>
              <Window position={[L + 0.02, 1.75, z]} rotationY={Math.PI / 2} w={1.25} h={1.35} sunset={sunset} />
              <Radiator position={[L + 0.1, 0, z]} rotationY={Math.PI / 2} w={1.1} />
            </group>
          ))}
          <Poster position={[L + 0.03, 1.7, -2.2]} rotationY={Math.PI / 2} w={0.5} h={0.7} bg="#F5B942" fg="#1E2F55" title="π" sub="3,14159…" />
          <Poster position={[L + 0.03, 1.7, 2.2]} rotationY={Math.PI / 2} w={0.5} h={0.7} bg="#2A4BD7" fg="#F4F1EA" title="E=mc²" sub="Physique" />
          {/* Bureau du prof */}
          <Table position={[L + 1.2, 0, 1.6]} rotationY={Math.PI / 2} w={1.5} d={0.75} top={sunset ? "#9C7C58" : "#B99468"} />
          <Seat position={[L + 0.6, 0, 1.6]} rotationY={Math.PI / 2} color="#1E2F55" />
          <DeskClutter position={[L + 1.2, 0.76, 1.6]} rotationY={Math.PI / 2} seed={2} />
          {/* Tables d'élèves : 3 rangées × 2, face au tableau */}
          {[-6.2, -4.5, -2.8].map((x, r) => [-1.7, 1.7].map((z, c) => (
            <group key={`${r}${c}`}>
              <Table position={[x, 0, z]} rotationY={Math.PI / 2} w={1.25} d={0.55} h={0.72} top={sunset ? "#B89E7A" : "#D9C29C"} legs="#3E6FB0" />
              <Seat position={[x + 0.5, 0, z - 0.3]} rotationY={-Math.PI / 2} color="#3E6FB0" shell />
              <Seat position={[x + 0.5, 0, z + 0.3]} rotationY={-Math.PI / 2} color="#3E6FB0" shell />
              <DeskClutter position={[x, 0.74, z]} rotationY={Math.PI / 2} seed={r * 2 + c} />
            </group>
          )))}
          {/* Figurants : le professeur au tableau, trois élèves qui prennent des notes */}
          <Figure clip="look-around" position={[-8.4, 0, -2.45]} rotationY={Math.PI / 2 + 0.25} tint={CLAY_COOL} offset={0.1} essential />
          <Figure clip="write-board" position={[-5.7, -0.08, -2.0]} rotationY={-Math.PI / 2} scale={0.95} offset={0.35} />
          <Figure clip="write-board" position={[-4.0, -0.08, 2.0]} rotationY={-Math.PI / 2} tint={CLAY_WARM} scale={0.93} offset={0.8} />
          <Figure clip="sit-idle" position={[-2.3, 0, -1.4]} rotationY={-Math.PI / 2} scale={0.96} offset={0.55} />
          <Lockers position={[-5.2, 0, F - 0.1]} rotationY={Math.PI} n={6} color={sunset ? "#355F95" : "#3E6FB0"} />
          <Plant position={[L + 0.45, 0, -F + 0.35]} kind="tall" />
        </group>
      );
    case "concertae":
      return (
        <group>
          <Sign image="/logos/concertae.png" position={[L + 0.06, 2.3, 0]} rotation={[0, Math.PI / 2, 0]} width={2.5} bg="#FFFFFF" />
          {[-3.2, 3.2].map((z) => <Window key={z} position={[L + 0.02, 1.7, z]} rotationY={Math.PI / 2} w={1.3} h={1.4} sunset={sunset} blinds />)}
          <BinderShelf position={[-6.6, 0, F - 0.05]} rotationY={Math.PI} w={2.2} />
          <BinderShelf position={[-6.6, 0, -F + 0.05]} w={2.2} />
          {/* Postes de travail : écran face à la caméra */}
          {[[-6.2, -1.6], [-6.2, 1.6], [-3.8, -1.6], [-3.8, 1.6]].map(([x, z], i) => (
            <group key={i}>
              <Table position={[x, 0, z]} rotationY={Math.PI / 2} w={1.5} d={0.8} top={sunset ? "#EDE6DA" : "#F6F2EA"} wood={false} />
              <Monitor position={[x - 0.15, 0.76, z]} rotationY={Math.PI / 2} tex={shT} />
              <Seat position={[x + 0.65, 0, z]} rotationY={-Math.PI / 2} color="#23262E" />
              <DeskClutter position={[x + 0.1, 0.76, z + 0.45]} rotationY={Math.PI / 2} seed={i + 1} />
            </group>
          ))}
          {/* Figurants : deux collègues au clavier ; le poste marqué d'un point reste libre (celui d'Indy) */}
          <Figure clip="typing" position={[-5.55, 0, 1.6]} rotationY={-Math.PI / 2} offset={0.2} essential />
          <Figure clip="typing" position={[-3.15, 0, -1.6]} rotationY={-Math.PI / 2} tint={CLAY_WARM} scale={0.96} offset={0.6} />
          <Printer position={[-2.2, 0, F - 0.25]} rotationY={Math.PI} />
          <WaterCooler position={[-1.5, 0, -F + 0.3]} />
          <Plant position={[L + 0.45, 0, -F + 0.4]} kind="leafy" scale={1.3} />
          <Plant position={[L + 0.45, 0, F - 0.4]} kind="tall" scale={1.2} />
          {/* Les deux logiciels du quotidien, en plaques lisibles de part et d'autre du logo */}
          <Badge position={[L + 0.03, 2.2, -2.08]} rotationY={Math.PI / 2} w={0.84} title="Cegid" fg="#2E5FA8" />
          <Badge position={[L + 0.03, 2.2, 2.08]} rotationY={Math.PI / 2} w={0.84} title="Pennylane" fg="#12325B" />
        </group>
      );
    case "indysigner":
      return (
        <group>
          {/* Tapis */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.02, 0]} receiveShadow><circleGeometry args={[1.7, 48]} /><TexMat tex={cpT} color={sunset ? "#D9CBB5" : "#EFE6D6"} bump={0.006} rough={1} /></mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.024, 0]}><ringGeometry args={[1.42, 1.52, 48]} /><Flat color={a} /></mesh>
          {/* Mur marine : logo + grand bureau à 3 écrans */}
          <Sign image="/logos/indysigner.webp" position={[L + 0.06, 2.55, -2.2]} rotation={[0, Math.PI / 2, 0]} width={1.7} bg="#F4EFE6" />
          <Table position={[L + 0.55, 0, -2.2]} rotationY={Math.PI / 2} w={2.4} d={0.85} top={sunset ? "#8E7658" : "#D9BE94"} />
          {[-0.8, 0, 0.8].map((dz, i) => <Monitor key={i} position={[L + 0.4, 0.76, -2.2 + dz]} rotationY={Math.PI / 2 - (i - 1) * 0.28} tex={cdT} w={0.66} h={0.4} />)}
          <Seat position={[L + 1.35, 0, -2.2]} rotationY={-Math.PI / 2} color="#1E2A3F" />
          <Laptop position={[L + 0.75, 0.78, -1.1]} rotation={[0, Math.PI / 2 + 0.4, 0]} accent={a} />
          <Plant position={[L + 0.5, 0.76, -3.45]} kind="leafy" scale={0.55} />
          {/* Mur marine : tableau « pipeline » entre le bureau et le placard (point « Prospection automatisée ») */}
          <PipelineBoard position={[L + 0.03, 1.8, -0.1]} rotationY={Math.PI / 2} w={1.4} />
          {/* Mur marine : placard à Legos + guitare */}
          <LegoShelf position={[L + 0.3, 0, 1.4]} rotation={[0, Math.PI / 2, 0]} />
          <group position={[L + 0.35, 0, 2.8]} rotation={[0, Math.PI / 2, 0.12]}>
            <mesh position={[0, 0.35, 0]} scale={[0.22, 0.28, 0.06]} castShadow><sphereGeometry args={[1, 16, 12]} /><Flat color="#B5652E" roughness={0.4} /></mesh>
            <mesh position={[0, 0.6, 0]} scale={[0.17, 0.2, 0.06]} castShadow><sphereGeometry args={[1, 16, 12]} /><Flat color="#B5652E" roughness={0.4} /></mesh>
            <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.05, 0.75, 0.03]} /><Flat color="#3A2A1E" /></mesh>
            <mesh position={[0, 0.45, 0.062]}><circleGeometry args={[0.06, 16]} /><Flat color="#1B1B22" /></mesh>
          </group>
          {/* Mur de sortie : fenêtre, grand lit double, tables de nuit */}
          <Window position={[-4.6, 1.95, F - 0.04]} rotationY={Math.PI} w={1.9} h={1.2} sunset={sunset} beam={false} />
          <Bed position={[-4.6, 0, F - 1.25]} rotation={[0, Math.PI, 0]} accent="#132948" frame={sunset ? "#8C7456" : "#B8966B"} />
          {[-6, -3.2].map((x) => (
            <group key={x} position={[x, 0, F - 0.35]}>
              <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.5, 0.56, 0.42]} /><Flat color={sunset ? "#8C7456" : "#B8966B"} /></mesh>
              <mesh position={[0, 0.66, 0]}><cylinderGeometry args={[0.06, 0.09, 0.2, 12]} /><Flat color="#F4F1EA" /></mesh>
              <mesh position={[0, 0.84, 0]}><coneGeometry args={[0.15, 0.2, 16, 1, true]} /><Flat color={a} emissive="#FFD9A0" emissiveIntensity={sunset ? 0.7 : 0} /></mesh>
            </group>
          ))}
          <Poster position={[-1.9, 1.8, F - 0.03]} rotationY={Math.PI} w={0.6} h={0.85} bg="#1E2F55" fg="#C8694F" title="LIVE" sub="Concert · 2025" />
          <Plant position={[-1.2, 0, -F + 0.4]} kind="tall" />
        </group>
      );
    case "albert":
      return (
        <group>
          {carpet}
          <Sign image="/logos/albert-x-mines.webp" position={[L + 0.06, 2.75, -2.1]} rotation={[0, Math.PI / 2, 0]} width={1.9} bg="#FFFFFF" />
          <Whiteboard position={[L + 0.04, 0, 1.3]} rotationY={Math.PI / 2} accent={a} />
          <Window position={[L + 0.02, 1.7, -3.6]} rotationY={Math.PI / 2} w={1} h={1.4} sunset={sunset} />
          {/* Tables de travail en îlots, ordinateurs portables */}
          {[[-6.2, -1.9], [-6.2, 1.9], [-3.6, -1.9], [-3.6, 1.9]].map(([x, z], i) => (
            <group key={i}>
              <Table position={[x, 0, z]} rotationY={Math.PI / 2} w={1.6} d={0.9} top={sunset ? "#D6D0C4" : "#F4F1EA"} wood={false} legs="#1E2F55" />
              <Laptop position={[x - 0.1, 0.76, z - 0.35]} rotation={[0, Math.PI / 2, 0]} accent={a} />
              <Laptop position={[x - 0.1, 0.76, z + 0.35]} rotation={[0, Math.PI / 2 + 0.3, 0]} accent="#7FD1B9" />
              <Seat position={[x + 0.7, 0, z - 0.35]} rotationY={-Math.PI / 2} color="#1E2F55" shell />
              <Seat position={[x + 0.7, 0, z + 0.35]} rotationY={-Math.PI / 2} color="#1E2F55" shell />
              <DeskClutter position={[x - 0.4, 0.76, z]} rotationY={Math.PI / 2} seed={i + 3} />
            </group>
          ))}
          {/* Figurants : trois étudiants sur leurs portables, un quatrième debout qui regarde le tableau de bord */}
          <Figure clip="typing" position={[-5.5, 0, -2.25]} rotationY={-Math.PI / 2} offset={0.15} essential />
          <Figure clip="typing" position={[-5.5, 0, 1.55]} rotationY={-Math.PI / 2} tint={CLAY_COOL} scale={0.95} offset={0.45} />
          <Figure clip="write-board" position={[-2.9, -0.08, 2.25]} rotationY={-Math.PI / 2} tint={CLAY_WARM} scale={0.97} offset={0.7} />
          <Figure clip="look-around" position={[-7.2, 0, 3.3]} rotationY={Math.PI / 2 - 0.6} offset={0.4} />
          <Beanbag position={[-8.3, 0, F - 0.7]} color={a} />
          <Beanbag position={[-7.1, 0, F - 0.5]} color="#F5B942" />
          <BinderShelf position={[-4.4, 0, F - 0.05]} rotationY={Math.PI} w={2.2} />
          <Plant position={[L + 0.45, 0, -F + 0.4]} kind="leafy" scale={1.4} />
          <Plant position={[-1.4, 0, F - 0.4]} kind="tall" scale={1.2} />
        </group>
      );
  }
  return null;
}

const cxOf = (wid: number) => -wid / 2 + DOOR_W / 2 + 0.75;

const SIGNS: Record<string, string> = { lycee: "03 · LYCÉE", concertae: "04 · CONCERTAE", indysigner: "05 · INDYSIGNER", albert: "06 · ALBERT SCHOOL" };
const signOf = (c: Chapter) => SIGNS[c.id];

export { Blob };
