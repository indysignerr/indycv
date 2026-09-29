"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";

export type Clip = "idle" | "walk" | "run" | "tennis-forehand" | "soccer-kick" | "typing" | "dance" | "celebrate";

const MODEL = "/models/indy.glb";

export function IndyCharacter({ clip, ...props }: { clip: Clip } & React.ComponentProps<"group">) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, group);
  const current = useRef<Clip | null>(null);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [scene]);

  useEffect(() => {
    const next = actions[clip];
    if (!next) return;
    const prev = current.current ? actions[current.current] : null;
    next.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(0.35).play();
    if (prev && prev !== next) prev.fadeOut(0.35);
    current.current = clip;
  }, [clip, actions]);

  // Léger balancement pour que le perso ne paraisse jamais figé
  useFrame(({ clock }) => {
    if (group.current) group.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <group ref={group} {...props}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL);
