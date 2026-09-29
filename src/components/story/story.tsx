"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { scroll } from "@/lib/scroll-progress";
import { chapters } from "@/lib/story";
import { Intro } from "./intro";
import { Panels } from "./panels";

const StoryCanvas = dynamic(() => import("./story-canvas").then((m) => m.StoryCanvas), { ssr: false });

/** Orchestration : intro → scroll débloqué → canvas + panneaux. Fallback = page classique si pas de WebGL / reduced-motion. */
export function Story({ fallback }: { fallback: React.ReactNode }) {
  const [mode, setMode] = useState<"unknown" | "story" | "fallback">("unknown");
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    setMode(!calm && gl ? "story" : "fallback");
  }, []);

  // Scroll verrouillé tant que l'histoire n'a pas commencé
  useEffect(() => {
    if (mode !== "story") return;
    document.documentElement.classList.toggle("story-locked", !started);
    if (started) scroll.lenis?.start(); else scroll.lenis?.stop();
    scroll.started = started;
  }, [mode, started]);

  if (mode === "fallback") return <>{fallback}</>;
  if (mode === "unknown") return <div className="min-h-screen" />;

  return (
    <>
      <StoryCanvas onReady={() => setReady(true)} />
      <AnimatePresence>{!started && <Intro ready={ready} onStart={() => { window.scrollTo(0, 0); setStarted(true); }} />}</AnimatePresence>
      {started && <Panels />}
      {/* Longueur de scroll = longueur de l'histoire (texte sémantique pour SEO / lecteurs d'écran) */}
      <main className="relative z-10">
        <div className="sr-only">
          <h1>Indy François — Business, data & code. Un seul cerveau.</h1>
          {chapters.map((c) => (
            <section key={c.id}><h2>{c.title.fr}</h2><p>{c.text.fr}</p></section>
          ))}
        </div>
        <div aria-hidden style={{ height: `${chapters.length * 220 + 120}vh` }} />
      </main>
    </>
  );
}
