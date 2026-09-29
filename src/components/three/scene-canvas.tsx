"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { World } from "./world";

/** Canvas 3D fixe derrière le HTML. Absent si reduced-motion ou WebGL indisponible. */
export function SceneCanvas() {
  const { theme } = useApp();
  const [ready, setReady] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) return;
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    setReady(true);
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        scroll.progress = self.progress;
        scroll.velocity = self.getVelocity();
      },
    });
    return () => st.kill();
  }, []);

  if (!ready) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, mobile ? 1.3 : 1.75]}
        shadows={!mobile}
        camera={{ fov: 38, near: 0.1, far: 50, position: [2.4, 1.5, 4.2] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <World dark={theme === "dark"} mobile={mobile} />
        </Suspense>
      </Canvas>
      {/* Fondu vers le fond pour que le texte reste lisible */}
      <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/70 to-transparent lg:via-bg/40" />
    </div>
  );
}
