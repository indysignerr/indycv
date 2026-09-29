"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Preload } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { World } from "./world";

export function StoryCanvas({ onReady }: { onReady?: () => void }) {
  const { theme } = useApp();
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        scroll.progress = self.progress;
        scroll.velocity = self.getVelocity();
      },
    });
    const onMove = (e: PointerEvent) => {
      scroll.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      scroll.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => { st.kill(); window.removeEventListener("pointermove", onMove); };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={[1, mobile ? 1.5 : 1.75]}
        shadows={!mobile}
        camera={{ fov: mobile ? 50 : 36, near: 0.1, far: 80, position: [4, 3, 6] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
      >
        <Suspense fallback={null}>
          <World sunset={theme === "dark"} mobile={mobile} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
