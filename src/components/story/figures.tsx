"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Clip } from "@/lib/story";
import { scroll } from "@/lib/scroll-progress";

const MODEL = "/models/indy.glb";

/**
 * Figurants : les gens croisés dans chaque lieu, rendus comme des « souvenirs » en argile claire.
 * Même squelette et mêmes animations Mixamo que le personnage, mais une seule géométrie fusionnée
 * (4 appels de dessin par figurant), sans textures, avec un liseré de lumière sur la silhouette.
 */

type Slot = "skin" | "top" | "sleeve" | "bottom" | "hair";
const SLOTS: Slot[] = ["skin", "top", "sleeve", "bottom", "hair"];
const SLOT_OF: Record<string, Slot | null> = {
  Std_Skin_Head: "skin", Std_Skin_Body: "skin", Std_Skin_Arm: "skin", Std_Nails: "skin", Std_Eye_R: "skin",
  lambert3SG: "top", lambert4: "bottom", Laces: "bottom", BackShoe: "bottom", FrontShoe: "bottom",
  Classic_Taper_Scalp: "hair", Std_Eyelash: null, Classic_Taper: null,
};

/** Recopie une géométrie en ne gardant que ce qu'il faut pour un maillage skinné non texturé, avec des types uniformes. */
function normalize(src: THREE.BufferGeometry) {
  const g = new THREE.BufferGeometry();
  const pos = src.getAttribute("position"), nor = src.getAttribute("normal"), uv = src.getAttribute("uv");
  const si = src.getAttribute("skinIndex"), sw = src.getAttribute("skinWeight");
  const n = pos.count;
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2), I = new Uint16Array(n * 4), W = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    P[i * 3] = pos.getX(i); P[i * 3 + 1] = pos.getY(i); P[i * 3 + 2] = pos.getZ(i);
    N[i * 3] = nor.getX(i); N[i * 3 + 1] = nor.getY(i); N[i * 3 + 2] = nor.getZ(i);
    if (uv) { U[i * 2] = uv.getX(i); U[i * 2 + 1] = uv.getY(i); }
    I[i * 4] = si.getX(i); I[i * 4 + 1] = si.getY(i); I[i * 4 + 2] = si.getZ(i); I[i * 4 + 3] = si.getW(i);
    W[i * 4] = sw.getX(i); W[i * 4 + 1] = sw.getY(i); W[i * 4 + 2] = sw.getZ(i); W[i * 4 + 3] = sw.getW(i);
  }
  g.setAttribute("position", new THREE.BufferAttribute(P, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(N, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(U, 2));
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(I, 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(W, 4));
  const idx = src.getIndex();
  g.setIndex(idx ? Array.from(idx.array as ArrayLike<number>) : Array.from({ length: n }, (_, i) => i));
  return g;
}

/** Sépare les triangles d'une géométrie skinnée selon qu'ils suivent surtout les os des bras (manches) ou non (torse). */
function splitByBones(g: THREE.BufferGeometry, arm: Set<number>) {
  const si = g.getAttribute("skinIndex"), sw = g.getAttribute("skinWeight"), idx = g.getIndex()!;
  const armW = (v: number) => {
    let w = 0;
    for (let k = 0; k < 4; k++) if (arm.has(si.getComponent(v, k))) w += sw.getComponent(v, k);
    return w;
  };
  const torso: number[] = [], sleeves: number[] = [];
  for (let i = 0; i < idx.count; i += 3) {
    const a = idx.getX(i), b = idx.getX(i + 1), c = idx.getX(i + 2);
    ((armW(a) + armW(b) + armW(c)) / 3 > 0.5 ? sleeves : torso).push(a, b, c);
  }
  const part = (tri: number[]) => { const p = new THREE.BufferGeometry(); for (const [k, v] of Object.entries(g.attributes)) p.setAttribute(k, v); p.setIndex(tri); return p; };
  return [part(torso), part(sleeves)] as const;
}

/** Géométrie fusionnée par « emplacement » (peau, torse, manches, bas, cheveux), partagée par tous les figurants. */
function buildKit(scene: THREE.Object3D) {
  const bySlot: Record<Slot, THREE.BufferGeometry[]> = { skin: [], top: [], sleeve: [], bottom: [], hair: [] };
  let hairMap: THREE.Texture | null = null;
  scene.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const slot = SLOT_OF[mat.name];
    if (!slot) return;
    if (slot === "hair") hairMap = mat.map;
    if (slot === "top") {
      // Manches d'un ton plus soutenu que le torse : les bras se lisent même le long du corps
      const arm = new Set(m.skeleton.bones.flatMap((b, i) => (/(Left|Right)(Arm|ForeArm|Hand)/.test(b.name) ? [i] : [])));
      const [torso, sleeves] = splitByBones(normalize(m.geometry), arm);
      bySlot.top.push(torso); bySlot.sleeve.push(sleeves);
      return;
    }
    bySlot[slot].push(normalize(m.geometry));
  });
  const parts = SLOTS.map((s) => mergeGeometries(bySlot[s], false)!);
  const geometry = mergeGeometries(parts, true)!; // un groupe par emplacement → 4 appels de dessin
  geometry.computeBoundingSphere();
  return { geometry, hairMap: hairMap as THREE.Texture | null };
}

/** Argile mate + liseré (fresnel) : la silhouette se détache sans éclairage supplémentaire. */
function clay(color: string, rim: string, opts: { alphaMap?: THREE.Texture | null } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, envMapIntensity: 0.5 });
  if (opts.alphaMap) { m.map = opts.alphaMap; m.alphaTest = 0.45; }
  const uRim = { value: new THREE.Color(rim) };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = uRim;
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform vec3 rimColor;")
      // Couleur unie : la texture éventuelle ne sert qu'à découper (cheveux)
      .replace("#include <map_fragment>", "#ifdef USE_MAP\n  diffuseColor.a *= texture2D( map, vMapUv ).a;\n#endif")
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n  float rimF = 1.0 - clamp( dot( normalize( vViewPosition ), normal ), 0.0, 1.0 );\n  totalEmissiveRadiance += rimColor * pow( rimF, 3.0 ) * 0.55;");
  };
  m.customProgramCacheKey = () => `clay-rim-${opts.alphaMap ? "a" : "o"}`;
  return m;
}

export type FigureTint = { skin: string; top: string; sleeve: string; bottom: string; hair: string; rim: string };
export const CLAY: FigureTint = { skin: "#EAD9C6", top: "#F7F2EA", sleeve: "#CFC2B1", bottom: "#B3A796", hair: "#8C7E6E", rim: "#FFF6E8" };
/** Variantes discrètes (haut plus chaud / plus froid) pour distinguer les silhouettes sans casser l'unité. */
export const CLAY_WARM: FigureTint = { ...CLAY, top: "#EBD9C2", sleeve: "#C6AE92", bottom: "#A99A88", hair: "#6F5F50" };
export const CLAY_COOL: FigureTint = { ...CLAY, top: "#E6EAF0", sleeve: "#B9C0CB", bottom: "#9FA6B0", hair: "#9A8F84" };

/** Sur mobile, seuls les figurants « essentiels » sont dessinés (un par lieu). */
const LITE = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

/** Un figurant : clone du squelette, géométrie partagée, sa propre animation (décalée pour ne pas être synchrone). */
export function Figure(props: React.ComponentProps<typeof FigureBody>) {
  if (LITE && !props.essential) return null;
  return <FigureBody {...props} />;
}

function FigureBody({ clip, position, rotationY = 0, scale = 1, tint = CLAY, offset = 0, speed = 1, children, hand, clockId }: {
  clip: Clip;
  /** Gardé sur mobile (un figurant par lieu). */
  essential?: boolean;
  /** Publie la phase de l'animation (0..1) dans `scroll.clocks[clockId]` (synchronisation du son). */
  clockId?: string;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  tint?: FigureTint;
  offset?: number;
  speed?: number;
  /** Objet tenu dans la main droite (ex. raquette), attaché à l'os. */
  hand?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { scene, animations } = useGLTF(MODEL);
  const kit = useMemo(() => buildKit(scene), [scene]);
  const mats = useMemo(() => [clay(tint.skin, tint.rim), clay(tint.top, tint.rim), clay(tint.sleeve, tint.rim), clay(tint.bottom, tint.rim), clay(tint.hair, tint.rim, { alphaMap: kit.hairMap })], [tint, kit]);
  const root = useMemo(() => {
    const r = cloneSkinned(scene);
    const skinned: THREE.SkinnedMesh[] = [];
    r.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh); });
    const keep = skinned[0];
    keep.geometry = kit.geometry;
    keep.material = mats;
    keep.castShadow = true;
    keep.receiveShadow = true;
    keep.frustumCulled = false;
    for (const m of skinned.slice(1)) m.removeFromParent();
    return r;
  }, [scene, kit, mats]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const action = useRef<THREE.AnimationAction | null>(null);
  useEffect(() => {
    const c = animations.find((a) => a.name === clip);
    if (!c) return;
    const a = mixer.clipAction(c);
    a.setLoop(THREE.LoopRepeat, Infinity).play();
    a.time = offset * c.duration;
    a.timeScale = speed;
    action.current = a;
    return () => { a.stop(); mixer.uncacheAction(c); action.current = null; };
  }, [animations, clip, mixer, offset, speed]);

  const holder = useRef<THREE.Group>(null);
  const handBone = useMemo(() => root.getObjectByName("mixamorigRightHand") ?? null, [root]);
  useEffect(() => {
    const g = holder.current;
    if (!g || !handBone) return;
    handBone.add(g);
    return () => { handBone.remove(g); };
  }, [handBone]);

  const group = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }, dt) => {
    const g = group.current;
    if (!g) return;
    // Pas d'animation quand la pièce est masquée ; figurant masqué au-delà de 24 m de la caméra
    for (let o: THREE.Object3D | null = g.parent; o; o = o.parent) if (!o.visible) return;
    const far = g.getWorldPosition(tmp).distanceTo(camera.position) > 24;
    if (root.visible === far) root.visible = !far;
    if (far) return;
    mixer.update(Math.min(dt, 0.1));
    const a = action.current;
    if (clockId && a) scroll.clocks[clockId] = (a.time % a.getClip().duration) / a.getClip().duration;
  });

  return (
    <group ref={group} position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <primitive object={root} />
      {hand && <group ref={holder}>{hand}</group>}
      {children}
    </group>
  );
}

/** Raquette stylisée (tenue par un figurant). */
export function Racket({ color = "#2A4BD7" }: { color?: string }) {
  const strings = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.strokeStyle = "#fff"; g.lineWidth = 2;
    for (let i = 4; i < 64; i += 7) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 64); g.moveTo(0, i); g.lineTo(64, i); g.stroke(); }
    const t = new THREE.CanvasTexture(c);
    return t;
  }, []);
  return (
    <group position={[0, 0.09, 0.03]} rotation={[Math.PI / 2, Math.PI / 2, 0]}>
      <mesh position={[0, 0.13, 0]} castShadow><cylinderGeometry args={[0.016, 0.014, 0.28, 8]} /><meshStandardMaterial color="#1B1B22" roughness={0.8} /></mesh>
      <mesh position={[0, 0.43, 0]} scale={[1, 1.25, 1]} castShadow><torusGeometry args={[0.12, 0.013, 8, 28]} /><meshStandardMaterial color={color} roughness={0.5} /></mesh>
      <mesh position={[0, 0.43, 0]} scale={[1, 1.25, 1]}><circleGeometry args={[0.118, 28]} /><meshStandardMaterial color="#F4F1EA" alphaMap={strings} transparent alphaTest={0.3} side={THREE.DoubleSide} roughness={1} /></mesh>
    </group>
  );
}
