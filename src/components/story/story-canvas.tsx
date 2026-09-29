"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/components/providers";
import { scroll, splitProgress } from "@/lib/scroll-progress";
import { World } from "./world";

export function StoryCanvas({ onReady }: { onReady?: () => void }) {
  const { theme, lang } = useApp();
  const [mobile, setMobile] = useState(false);
  const [dpr, setDpr] = useState(1.5);

  useEffect(() => {
    setMobile(window.matchMedia("(max-width: 768px)").matches);
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        const sp = splitProgress(self.progress);
        scroll.raw = self.progress;
        scroll.progress = sp.story;
        scroll.intro = sp.intro;
        scroll.end = sp.end;
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
        dpr={dpr}
        shadows={!mobile}
        camera={{ fov: mobile ? 50 : 36, near: 0.1, far: 80, position: [4, 3, 6] }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMappingExposure: 1.06 }}
        onCreated={() => onReady?.()}
      >
        <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(1, d - 0.25))} onIncline={() => setDpr((d) => Math.min(mobile ? 1.5 : 1.75, d + 0.25))} flipflops={3} onFallback={() => setDpr(1)} />
        <Suspense fallback={null}>
          <World sunset={theme === "dark"} mobile={mobile} lang={lang} />
          <Preload all />
        </Suspense>
      </Canvas>
      <div className="story-grade" aria-hidden />
    </div>
  );
}
