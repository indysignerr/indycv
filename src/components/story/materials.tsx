"use client";

import * as THREE from "three";

/** Matériau plat, doux, cohérent partout : la signature visuelle du diorama. */
export function Flat({ color, emissive, emissiveIntensity = 0, roughness = 0.95, flat = false }: { color: string; emissive?: string; emissiveIntensity?: number; roughness?: number; flat?: boolean }) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={0} emissive={emissive ?? "#000000"} emissiveIntensity={emissiveIntensity} flatShading={flat} />;
}

/** Ciel en dégradé : grande sphère inversée, couleur haut/bas interpolée. */
export function GradientSky({ top, bottom }: { top: string; bottom: string }) {
  const uniforms = { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } };
  uniforms.top.value.set(top); uniforms.bottom.value.set(bottom);
  return (
    <mesh scale={[400, 400, 400]} frustumCulled={false}>
      <sphereGeometry args={[1, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`varying float vY; void main(){ vY = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 top; uniform vec3 bottom; varying float vY; void main(){ float t = smoothstep(-0.1, 0.6, vY); gl_FragColor = vec4(mix(bottom, top, t), 1.0); }`}
      />
    </mesh>
  );
}
