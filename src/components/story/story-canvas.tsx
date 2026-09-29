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
  const { theme, lang } = useApp();
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
    return () => st.kill();
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, mobile ? 1.5 : 2]}
        shadows={!mobile}
        camera={{ fov: mobile ? 55 : 42, near: 0.1, far: 120, position: [2, 2, 6] }}
        gl={{ antialias: !mobile, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
      >
        <Suspense fallback={null}>
          <World sunset={theme === "dark"} mobile={mobile} lang={lang} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
