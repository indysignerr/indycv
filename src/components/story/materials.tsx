"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Matériau plat, doux, cohérent partout : la signature visuelle du diorama. */
export function Flat({ color, emissive, emissiveIntensity = 0, roughness = 0.8, flat = false }: { color: string; emissive?: string; emissiveIntensity?: number; roughness?: number; flat?: boolean }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0} envMapIntensity={0.55} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity} flatShading={flat} />;
}

/** Nuages plats et lents, très loin, pour donner de la vie au ciel. */
export function Clouds({ sunset }: { sunset: boolean }) {
  const items = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ x: -30 + (i * 37) % 70, y: 14 + (i * 5) % 9, z: -15 - i * 11, s: 1.6 + (i * 7) % 5 * 0.4, sp: 0.15 + (i % 3) * 0.06 })), []);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.children.forEach((c, i) => { c.position.x += items[i].sp * dt; if (c.position.x > 45) c.position.x = -45; }); });
  const color = sunset ? "#FFD8C0" : "#FFFFFF";
  return (
    <group ref={g}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, it.y, it.z]} scale={it.s}>
          {[[0, 0, 0, 1.1], [1.0, 0.15, 0.2, 0.8], [-0.9, 0.1, -0.1, 0.75], [0.3, 0.45, -0.2, 0.7]].map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]}><sphereGeometry args={[r, 12, 10]} /><meshStandardMaterial color={color} roughness={1} fog={false} /></mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/** Ciel en dégradé : grande sphère inversée, couleur haut/bas interpolée. */
export function GradientSky({ top, bottom }: { top: string; bottom: string }) {
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { uniforms.top.value.set(top); uniforms.bottom.value.set(bottom); }, [top, bottom, uniforms]);
  // La sphère suit la caméra : elle ne doit jamais traverser la scène
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => { if (ref.current) ref.current.position.copy(camera.position); });
  return (
    <mesh ref={ref} scale={[70, 70, 70]} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={`varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 top; uniform vec3 bottom; varying float vY; void main(){ float t = smoothstep(-0.1, 0.6, vY); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }`}
      />
    </mesh>
  );
}
