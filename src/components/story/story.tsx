"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useState, type ReactNode } from "react";
import { scroll, TOTAL_VH } from "@/lib/scroll-progress";
import { chapters } from "@/lib/story";
import { detectTier, quality, qualityFor } from "@/lib/quality";
import { loading, useLoading } from "@/lib/loading";
import { MODEL_URL } from "@/lib/assets";
import { Intro } from "./intro";
import { Panels } from "./panels";
import { Controls } from "./controls";
import { PortalGlow } from "./portal-glow";
import { Cursor } from "./cursor";

const StoryCanvas = dynamic(() => import("./story-canvas").then((m) => m.StoryCanvas), { ssr: false });

/** Filet de sécurité : si la 3D plante (fichier introuvable, carte graphique capricieuse…), on affiche la version simple. */
class Guard extends Component<{ onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: unknown) { console.error("[3D]", error); this.props.onFail(); }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Orchestration : intro → scroll débloqué → canvas + panneaux. Fallback = page classique si pas de WebGL / reduced-motion. */
export function Story({ fallback }: { fallback: React.ReactNode }) {
  const [mode, setMode] = useState<"unknown" | "story" | "fallback">("unknown");

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Version simple : demandée par le visiteur (?simple ou bouton), mouvement réduit, ou appareil incapable
    let wantsSimple = new URLSearchParams(window.location.search).has("simple");
    try { wantsSimple ||= localStorage.getItem("view") === "simple"; } catch {}
    const tier = calm || wantsSimple ? "classic" : detectTier();
    if (tier !== "classic") {
      quality.set(qualityFor(tier, window.matchMedia("(max-width: 768px)").matches));
      // Le modèle 3D (le plus gros fichier) part tout de suite, en parallèle du code de la scène
      const link = document.createElement("link");
      link.rel = "preload"; link.as = "fetch"; link.href = MODEL_URL; link.crossOrigin = "anonymous";
      document.head.appendChild(link);
      // L'histoire commence toujours par l'accueil (pas de reprise au milieu d'une pièce pas encore prête)
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
    setMode(tier === "classic" ? "fallback" : "story");
  }, []);
  const fail = useCallback(() => setMode("fallback"), []);
  const { ready } = useLoading();

  // Outils de réglage du son (développement uniquement)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    import("@/lib/ambience").then((m) => Object.assign(window, { __ambience: m.ambience, __renderScene: m.renderScene, __Mixer: m.Mixer }));
  }, []);

  // Tant que la 3D se prépare, on peut défiler dans l'accueil mais pas au-delà (il reste opaque jusque-là)
  useEffect(() => {
    if (mode !== "story") return;
    scroll.started = true;
    const l = scroll.lenis;
    if (!l) return;
    return l.on("scroll", () => {
      if (loading.get().ready) return;
      const max = window.innerHeight * 0.8;
      if (l.scroll > max) l.scrollTo(max, { immediate: true, force: true });
    });
  }, [mode]);

  // Défilement infini (après la page de fin, on revient au début), une fois l'histoire prête
  useEffect(() => {
    if (mode !== "story" || !ready) return;
    const l = scroll.lenis;
    if (l) { (l.options as { infinite: boolean }).infinite = true; (l.options as { syncTouch: boolean }).syncTouch = true; }
    return () => { if (l) (l.options as { infinite: boolean }).infinite = false; };
  }, [mode, ready]);

  if (mode === "fallback") return <>{fallback}</>;
  if (mode === "unknown") return <div className="min-h-screen" />;

  return (
    <>
      <Guard onFail={fail}><StoryCanvas onFail={fail} /></Guard>
      <PortalGlow />
      <Intro />
      <Panels />
      <Controls />
      <Cursor />
      {/* Longueur de scroll = longueur de l'histoire (texte sémantique pour SEO / lecteurs d'écran) */}
      <main className="pointer-events-none relative z-10">
        <div className="sr-only">
          <h1>Indy François — Business, data & code.</h1>
          {chapters.map((c) => (
            <section key={c.id}><h2>{c.title.fr}</h2><p>{c.text.fr}</p></section>
          ))}
        </div>
        <div aria-hidden style={{ height: `${TOTAL_VH}vh` }} />
      </main>
    </>
  );
}
