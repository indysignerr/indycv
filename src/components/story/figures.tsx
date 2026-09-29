"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Clip } from "@/lib/story";

const MODEL = "/models/indy.glb";

/**
 * Figurants : les gens croisés dans chaque lieu, rendus comme des « souvenirs » en argile claire.
 * Même squelette et mêmes animations Mixamo que le personnage, mais une seule géométrie fusionnée
 * (4 appels de dessin par figurant), sans textures, avec un liseré de lumière sur la silhouette.
 */

type Slot = "skin" | "top" | "bottom" | "hair";
const SLOTS: Slot[] = ["skin", "top", "bottom", "hair"];
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

/** Géométrie fusionnée par « emplacement » (peau, haut, bas, cheveux), partagée par tous les figurants. */
function buildKit(scene: THREE.Object3D) {
  const bySlot: Record<Slot, THREE.BufferGeometry[]> = { skin: [], top: [], bottom: [], hair: [] };
  let hairMap: THREE.Texture | null = null;
  scene.traverse((o) => {
    const m = o as THREE.SkinnedMesh;
    if (!m.isSkinnedMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    const slot = SLOT_OF[mat.name];
    if (!slot) return;
    if (slot === "hair") hairMap = mat.map;
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

export type FigureTint = { skin: string; top: string; bottom: string; hair: string; rim: string };
export const CLAY: FigureTint = { skin: "#EFE6DA", top: "#F7F2EA", bottom: "#B9AE9F", hair: "#8C7E6E", rim: "#FFF6E8" };

/** Un figurant : clone du squelette, géométrie partagée, sa propre animation (décalée pour ne pas être synchrone). */
export function Figure({ clip, position, rotationY = 0, scale = 1, tint = CLAY, offset = 0, speed = 1, children, hand }: {
  clip: Clip;
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
  const mats = useMemo(() => [clay(tint.skin, tint.rim), clay(tint.top, tint.rim), clay(tint.bottom, tint.rim), clay(tint.hair, tint.rim, { alphaMap: kit.hairMap })], [tint, kit]);
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
  useEffect(() => {
    const c = animations.find((a) => a.name === clip);
    if (!c) return;
    const a = mixer.clipAction(c);
    a.setLoop(THREE.LoopRepeat, Infinity).play();
    a.time = offset * c.duration;
    a.timeScale = speed;
    return () => { a.stop(); mixer.uncacheAction(c); };
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
  useFrame((_, dt) => {
    // Pas d'animation quand la pièce est masquée (hors champ)
    for (let o: THREE.Object3D | null = group.current; o; o = o.parent) if (!o.visible) return;
    mixer.update(Math.min(dt, 0.1));
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
