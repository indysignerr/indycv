"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { scroll, TOTAL_VH } from "@/lib/scroll-progress";
import { chapters } from "@/lib/story";
import { Intro } from "./intro";
import { Panels } from "./panels";
import { Controls } from "./controls";
import { PortalGlow } from "./portal-glow";
import { Cursor } from "./cursor";

const StoryCanvas = dynamic(() => import("./story-canvas").then((m) => m.StoryCanvas), { ssr: false });

/** Orchestration : intro → scroll débloqué → canvas + panneaux. Fallback = page classique si pas de WebGL / reduced-motion. */
export function Story({ fallback }: { fallback: React.ReactNode }) {
  const [mode, setMode] = useState<"unknown" | "story" | "fallback">("unknown");

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    setMode(!calm && gl ? "story" : "fallback");
  }, []);

  // Outils de réglage du son (développement uniquement)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    import("@/lib/ambience").then((m) => Object.assign(window, { __ambience: m.ambience, __renderScene: m.renderScene, __Mixer: m.Mixer }));
  }, []);

  // Défilement infini : après la page de fin, on revient au début
  useEffect(() => {
    if (mode !== "story") return;
    const l = scroll.lenis;
    if (l) { (l.options as { infinite: boolean }).infinite = true; (l.options as { syncTouch: boolean }).syncTouch = true; }
    scroll.started = true;
    return () => { if (l) (l.options as { infinite: boolean }).infinite = false; };
  }, [mode]);

  if (mode === "fallback") return <>{fallback}</>;
  if (mode === "unknown") return <div className="min-h-screen" />;

  return (
    <>
      <StoryCanvas />
      <PortalGlow />
      <Intro />
      <Panels />
      <Controls />
      <Cursor />
      {/* Longueur de scroll = longueur de l'histoire (texte sémantique pour SEO / lecteurs d'écran) */}
      <main className="pointer-events-none relative z-10">
        <div className="sr-only">
          <h1>Indy François — Business, data & code. Un seul cerveau.</h1>
          {chapters.map((c) => (
            <section key={c.id}><h2>{c.title.fr}</h2><p>{c.text.fr}</p></section>
          ))}
        </div>
        <div aria-hidden style={{ height: `${TOTAL_VH}vh` }} />
      </main>
    </>
  );
}
