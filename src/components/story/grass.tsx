"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Herbe : brins instanciés (un seul draw call), qui ondulent au vent via le vertex shader.
 * `areas` : rectangles [xMin, xMax, zMin, zMax] où semer ; `exclude` : rectangles à éviter.
 */
export function Grass({ areas, exclude = [], count, base, tip, height = 0.28 }: {
  areas: [number, number, number, number][];
  exclude?: [number, number, number, number][];
  count: number;
  base: string;
  tip: string;
  height?: number;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);

  const geo = useMemo(() => {
    // Brin effilé : 3 segments, 7 sommets, couleur base → pointe en attribut
    const g = new THREE.BufferGeometry();
    const w = 0.022, h = 1;
    const pos = [-w, 0, 0, w, 0, 0, -w * 0.7, h * 0.4, 0, w * 0.7, h * 0.4, 0, -w * 0.35, h * 0.75, 0, w * 0.35, h * 0.75, 0, 0, h, 0];
    const idx = [0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6];
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }, []);

  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.9, metalness: 0 });
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uBase = { value: new THREE.Color(base) };
      shader.uniforms.uTip = { value: new THREE.Color(tip) };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying float vH;")
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          vH = position.y;
          vec4 wp = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          float wave = sin(uTime * 1.6 + wp.x * 0.35 + wp.z * 0.25) * 0.5 + sin(uTime * 2.7 + wp.x * 1.3) * 0.18;
          transformed.x += wave * position.y * position.y * 0.18;
          transformed.z += wave * position.y * position.y * 0.07;`);
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uBase;\nuniform vec3 uTip;\nvarying float vH;")
        .replace("vec4 diffuseColor = vec4( diffuse, opacity );", "vec4 diffuseColor = vec4( mix(uBase, uTip, smoothstep(0.0, 1.0, vH)), opacity );");
      // Normale vers le haut : l'herbe prend la lumière comme le sol, pas comme des cartes plates
      shader.vertexShader = shader.vertexShader.replace("#include <beginnormal_vertex>", "vec3 objectNormal = vec3(0.0, 1.0, 0.0);");
    };
    return m;
  }, [uniforms, base, tip]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    let seed = 11;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    const total = areas.reduce((a, r) => a + (r[1] - r[0]) * (r[3] - r[2]), 0);
    const o = new THREE.Object3D();
    let i = 0, guard = 0;
    while (i < count && guard < count * 4) {
      guard++;
      // Choix d'une zone proportionnel à sa surface
      let pick = rnd() * total, r = areas[0];
      for (const a of areas) { pick -= (a[1] - a[0]) * (a[3] - a[2]); if (pick <= 0) { r = a; break; } }
      const x = r[0] + rnd() * (r[1] - r[0]), z = r[2] + rnd() * (r[3] - r[2]);
      if (exclude.some((e) => x > e[0] && x < e[1] && z > e[2] && z < e[3])) continue;
      o.position.set(x, 0, z);
      o.rotation.set((rnd() - 0.5) * 0.25, rnd() * Math.PI, (rnd() - 0.5) * 0.25);
      const hh = height * (0.55 + rnd() * 0.9);
      o.scale.set(0.8 + rnd() * 0.6, hh, 1);
      o.updateMatrix();
      m.setMatrixAt(i++, o.matrix);
    }
    m.count = i;
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [areas, exclude, count, height]);

  useFrame(({ clock }) => { uniforms.uTime.value = clock.elapsedTime; });

  return <instancedMesh ref={mesh} args={[geo, mat, count]} frustumCulled={false} receiveShadow />;
}
