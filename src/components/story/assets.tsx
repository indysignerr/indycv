"use client";

import { useMemo } from "react";
import { Clone, useGLTF, useTexture } from "@react-three/drei";
import * as THREE from "three";

export const PROPS = {
  "tennis-court": "/models/props/tennis-court.glb",
  racket: "/models/props/racket.glb",
  goal: "/models/props/goal.glb",
  ball: "/models/props/ball.glb",
  chalkboard: "/models/props/chalkboard.glb",
  "computer-desk": "/models/props/computer-desk.glb",
  laptop: "/models/props/laptop.glb",
  "school-desk": "/models/props/school-desk.glb",
  bookshelf: "/models/props/bookshelf.glb",
} as const;
export type PropName = keyof typeof PROPS;

/** Modèle Sketchfab (CC-BY) instancié ; les ombres sont activées sur tous les meshes. */
export function Prop({ name, ...props }: { name: PropName } & React.ComponentProps<typeof Clone> extends infer P ? Omit<P, "object"> : never) {
  const { scene } = useGLTF(PROPS[name]);
  return <Clone object={scene} castShadow receiveShadow {...(props as object)} />;
}

Object.values(PROPS).forEach((u) => useGLTF.preload(u));

const TEX = ["grass", "gravel", "clay", "wood", "plaster", "concrete", "brick"] as const;
export type TexName = (typeof TEX)[number];

/** Textures PBR Poly Haven (CC0) : diffuse + normal + roughness, répétées. */
export function usePBR(name: TexName, repeat: [number, number]) {
  const t = useTexture({
    map: `/textures/${name}/diffuse.webp`,
    normalMap: `/textures/${name}/normal.webp`,
    roughnessMap: `/textures/${name}/rough.webp`,
  });
  return useMemo(() => {
    const out: Record<string, THREE.Texture> = {};
    for (const [k, tex] of Object.entries(t)) {
      const c = tex.clone();
      c.wrapS = c.wrapT = THREE.RepeatWrapping;
      c.repeat.set(repeat[0], repeat[1]);
      c.anisotropy = 8;
      if (k === "map") c.colorSpace = THREE.SRGBColorSpace;
      c.needsUpdate = true;
      out[k] = c;
    }
    return out as { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture };
  }, [t, repeat[0], repeat[1]]);
}

TEX.forEach((n) => useTexture.preload([`/textures/${n}/diffuse.webp`, `/textures/${n}/normal.webp`, `/textures/${n}/rough.webp`]));
