"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Regroupe les objets immobiles : tous les maillages d'un même matériau (mêmes ombres) sont fusionnés en un seul.
 * Une pièce passe de centaines d'appels de dessin à quelques dizaines : c'est le principal coût par image sur
 * un téléphone modeste. Les originaux restent dans la scène (React les gère toujours) mais masqués.
 *
 * Exclus automatiquement : ce qui bouge (un ancêtre marqué `userData.dynamic`), les personnages (maillages skinnés),
 * les instances, le transparent (tri par objet), les matériaux multiples, les objets en miroir (échelle négative)
 * et tout ce qui a un ordre de rendu particulier. On refusionne quand `deps` change (thème, langue).
 */
export const DYNAMIC = { dynamic: true } as const;

const isDynamic = (o: THREE.Object3D, stop: THREE.Object3D) => {
  for (let p: THREE.Object3D | null = o; p && p !== stop; p = p.parent) if (p.userData?.dynamic || !p.visible) return true;
  return false;
};

/**
 * Matériaux unis (sans image) : la couleur passe dans les sommets, et tous les objets de même finition
 * (rugosité, émission, facettes, face affichée…) partagent un seul matériau, donc un seul appel de dessin,
 * quelle que soit leur couleur. Rendu identique : même calcul d'éclairage, couleur lue par sommet.
 */
const vcCache = new Map<string, THREE.Material>();
const noHook = THREE.Material.prototype.onBeforeCompile;
type Std = THREE.MeshStandardMaterial;
type Basic = THREE.MeshBasicMaterial;
function plainKey(m: THREE.Material): string | null {
  if (m.userData?.animated || m.onBeforeCompile !== noHook || m.vertexColors || m.alphaTest > 0) return null;
  const common = `${m.side}|${m.toneMapped}|${(m as Std).fog}`;
  if ((m as Std).isMeshStandardMaterial && !(m as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial) {
    const s = m as Std;
    if (s.map || s.emissiveMap || s.normalMap || s.bumpMap || s.roughnessMap || s.metalnessMap || s.alphaMap || s.aoMap || s.lightMap || s.envMap || s.displacementMap) return null;
    return `std|${s.roughness}|${s.metalness}|${s.envMapIntensity}|${s.emissive.getHexString()}|${s.emissiveIntensity}|${s.flatShading}|${common}`;
  }
  if ((m as Basic).isMeshBasicMaterial) {
    const b = m as Basic;
    if (b.map || b.alphaMap || b.envMap || b.lightMap || b.aoMap || b.specularMap) return null;
    return `basic|${common}`;
  }
  return null;
}
function vertexColored(m: THREE.Material, key: string) {
  let v = vcCache.get(key);
  if (!v) {
    const base = { vertexColors: true, color: 0xffffff, side: m.side, toneMapped: m.toneMapped, fog: (m as Std).fog };
    if ((m as Std).isMeshStandardMaterial) {
      const s = m as Std;
      v = new THREE.MeshStandardMaterial({ ...base, roughness: s.roughness, metalness: s.metalness, envMapIntensity: s.envMapIntensity, emissive: s.emissive.clone(), emissiveIntensity: s.emissiveIntensity, flatShading: s.flatShading });
    } else v = new THREE.MeshBasicMaterial(base);
    vcCache.set(key, v);
  }
  return v;
}

function bake(src: THREE.BufferGeometry, matrix: THREE.Matrix4, color?: THREE.Color) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", (src.getAttribute("position") as THREE.BufferAttribute).clone());
  g.setAttribute("normal", (src.getAttribute("normal") as THREE.BufferAttribute).clone());
  const uv = src.getAttribute("uv") as THREE.BufferAttribute | undefined;
  if (uv) g.setAttribute("uv", uv.clone());
  if (src.index) g.setIndex(src.index.clone());
  if (color) {
    // THREE.Color est linéaire, comme les couleurs par sommet : rendu identique à la couleur du matériau
    const n = g.getAttribute("position").count, c = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { c[i * 3] = color.r; c[i * 3 + 1] = color.g; c[i * 3 + 2] = color.b; }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  }
  g.applyMatrix4(matrix);
  return g;
}

function mergeStatic(root: THREE.Object3D) {
  root.updateWorldMatrix(true, true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<string, { material: THREE.Material; flat: boolean; cast: boolean; receive: boolean; order: number; meshes: THREE.Mesh[] }>();
  const m4 = new THREE.Matrix4();
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || (m as THREE.SkinnedMesh).isSkinnedMesh || (m as THREE.InstancedMesh).isInstancedMesh) return;
    const mat = m.material as THREE.Material;
    if (!mat || Array.isArray(m.material) || (mat as THREE.ShaderMaterial).isShaderMaterial) return;
    // Transparent : seulement les décalques (ordre de dessin indifférent) ; ordre de rendu conservé
    const decal = !!mat.userData?.decal;
    if ((mat.transparent && !decal) || (m.renderOrder !== 0 && !decal) || m.userData?.noMerge || isDynamic(m, root)) return;
    const geo = m.geometry;
    const pos = geo.getAttribute("position"), nor = geo.getAttribute("normal");
    if (!pos || !nor || (pos as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute || Object.keys(geo.morphAttributes).length) return;
    if (m.matrixWorld.determinant() < 0) return;
    const pk = decal ? null : plainKey(mat);
    const flat = pk !== null;
    const key = `${pk ?? mat.uuid}|${m.castShadow}|${m.receiveShadow}|${!!geo.index}|${!!geo.getAttribute("uv")}|${m.renderOrder}`;
    let entry = groups.get(key);
    if (!entry) groups.set(key, (entry = { material: pk ? vertexColored(mat, pk) : mat, flat, cast: m.castShadow, receive: m.receiveShadow, order: m.renderOrder, meshes: [] }));
    entry.meshes.push(m);
  });
  const merged: THREE.Mesh[] = [];
  const hidden: THREE.Mesh[] = [];
  for (const e of groups.values()) {
    if (e.meshes.length < 2) continue;
    const geos = e.meshes.map((m) => bake(m.geometry, m4.multiplyMatrices(inv, m.matrixWorld), e.flat ? (m.material as Std | Basic).color : undefined));
    const g = mergeGeometries(geos, false);
    geos.forEach((x) => x.dispose());
    if (!g) continue;
    g.computeBoundingSphere();
    const mesh = new THREE.Mesh(g, e.material);
    mesh.castShadow = e.cast;
    mesh.receiveShadow = e.receive;
    mesh.renderOrder = e.order;
    mesh.userData.merged = true;
    root.add(mesh);
    merged.push(mesh);
    e.meshes.forEach((m) => { m.visible = false; hidden.push(m); });
  }
  return () => {
    merged.forEach((m) => { m.removeFromParent(); m.geometry.dispose(); });
    hidden.forEach((m) => { m.visible = true; });
  };
}

export function Static({ children, deps }: { children: React.ReactNode; deps: unknown[] }) {
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    if (!root.current) return;
    return mergeStatic(root.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <group ref={root}>{children}</group>;
}
