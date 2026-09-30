"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree, type RootState } from "@react-three/fiber";
import { PerformanceMonitor, useGLTF, useProgress, useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useApp } from "@/components/providers";
import { INTRO_VH, scroll, splitProgress, TOTAL_VH } from "@/lib/scroll-progress";
import { loading } from "@/lib/loading";
import { quality, qualityFor, refineTier, useQuality } from "@/lib/quality";
import { MODEL } from "./character";
import { labelsFont } from "./label";
import { applySoftShadows } from "./soft-shadows";
import { World, worldBuilt } from "./world";

/** Images chargées par la scène : toutes demandées d'un coup, en parallèle du modèle 3D. */
const LOGOS = ["/logos/concertae.png", "/logos/indysigner-wordmark.webp", "/logos/indysigner.webp", "/logos/albert-x-mines.webp"];
LOGOS.forEach((u) => useTexture.preload(u));
labelsFont();

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Attend que tout soit téléchargé AVANT de construire la scène : la scène n'est construite qu'une fois.
 * (Sinon, chaque fichier arrivé relançait toute la construction : textures dessinées, relief calculé… à chaque fois.)
 */
function Assets({ children }: { children: React.ReactNode }) {
  useGLTF(MODEL);
  // Liste fixe : l'ordre des appels ne change jamais
  // eslint-disable-next-line react-hooks/rules-of-hooks
  for (const u of LOGOS) useTexture(u);
  return <>{children}</>;
}

/**
 * Préparation derrière l'écran d'accueil (la 3D n'est pas encore affichée, rien ne tourne) :
 * 1) programmes de rendu compilés en parallèle par la carte graphique, sans bloquer la page ;
 * 2) textures envoyées à la carte graphique par petits paquets ;
 * 3) une image complète, ombres comprises. Ensuite, plus rien à préparer pendant la visite : pas d'à-coups.
 */
function Warmup({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    (async () => {
      await worldBuilt;
      loading.phase("compile", 0);
      await labelsFont();
      await nextFrame();
      if (!alive) return;
      // 1) programmes de rendu : compilés en parallèle par la carte graphique (même principe que compileAsync),
      //    en comptant ceux qui sont prêts pour faire avancer la barre au fil de l'eau
      try {
        const pending = new Set<THREE.Material>();
        let t1 = performance.now();
        // (les lumières sont déjà comptées via la scène : compiler une partie qui en contient les compterait deux fois)
        const hasLight = (o: THREE.Object3D) => { let found = false; o.traverse((c) => { if ((c as THREE.Light).isLight) found = true; }); return found; };
        for (const part of scene.children.filter((c) => !hasLight(c))) {
          (gl.compile(part, camera, scene) as Set<THREE.Material>).forEach((m) => pending.add(m));
          if (performance.now() - t1 > 12) { await nextFrame(); if (!alive) return; t1 = performance.now(); }
        }
        const total = Math.max(1, pending.size), t0 = performance.now();
        while (pending.size && performance.now() - t0 < 15000) {
          for (const m of pending) {
            const program = (gl.properties.get(m) as { currentProgram?: { isReady: () => boolean } }).currentProgram;
            if (!program || program.isReady()) pending.delete(m);
          }
          loading.phase("compile", 1 - pending.size / total);
          if (pending.size) await sleep(16);
          if (!alive) return;
        }
      } catch {}
      if (!alive) return;
      loading.phase("textures", 0);
      const textures = new Set<THREE.Texture>();
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (!m) return;
        for (const mat of Array.isArray(m) ? m : [m]) {
          for (const v of Object.values(mat)) {
            const t = v as THREE.Texture & { isRenderTargetTexture?: boolean };
            if (t && t.isTexture && !t.isRenderTargetTexture) textures.add(t);
          }
        }
      });
      let t0 = performance.now(), done = 0;
      for (const t of textures) {
        gl.initTexture(t);
        loading.phase("textures", ++done / textures.size);
        if (performance.now() - t0 > 10) { await nextFrame(); if (!alive) return; t0 = performance.now(); }
      }
      loading.phase("warm", 0);
      // 3) géométries et derniers réglages envoyés par lots (une fraction de la scène par image, même hors champ)
      const objects: THREE.Object3D[] = [];
      scene.traverse((o) => { if ((o as THREE.Mesh).isMesh || (o as THREE.Points).isPoints || (o as THREE.Line).isLine) objects.push(o); });
      const shown = objects.map((o) => o.visible), culled = objects.map((o) => o.frustumCulled);
      const restore = () => objects.forEach((o, k) => { o.visible = shown[k]; o.frustumCulled = culled[k]; });
      objects.forEach((o) => { o.frustumCulled = false; });
      // Taille des lots ajustée à l'appareil : ~12 ms de préparation par image (gros lots sur un ordinateur rapide)
      let size = 24;
      for (let i = 0; i < objects.length;) {
        const end = Math.min(objects.length, i + size);
        objects.forEach((o, k) => { o.visible = shown[k] && k >= i && k < end; });
        const t = performance.now();
        gl.render(scene, camera);
        const spent = performance.now() - t;
        size = Math.max(12, Math.min(400, Math.round(size * Math.min(2, 9 / Math.max(1, spent)))));
        i = end;
        loading.phase("warm", i / objects.length);
        await nextFrame();
        if (!alive) { restore(); return; }
      }
      restore();
      await nextFrame();
      if (!alive) return;
      gl.render(scene, camera);
      onReady();
    })();
    return () => { alive = false; };
  }, [gl, scene, camera, onReady]);
  return null;
}

export function StoryCanvas({ onFail }: { onFail: () => void }) {
  const { theme, lang } = useApp();
  const [mobile] = useState(() => window.matchMedia("(max-width: 768px)").matches);
  const q = useQuality();
  const [dpr, setDpr] = useState(q.dprStart);
  // Résolution plancher : 1 (0,8 sur les appareils faibles, pour garder de la fluidité)
  const minDpr = Math.min(q.dprMax, q.tier === "low" ? 0.8 : 1);
  const [gpuChecked, setGpuChecked] = useState(false);
  const [ready, setReady] = useState(false);
  const getState = useRef<(() => RootState) | null>(null);
  const readyRef = useRef(false);
  useEffect(() => { setDpr((d) => Math.min(d, q.dprMax)); }, [q.dprMax]);

  // 3D en pause quand elle est entièrement cachée (accueil ou page de fin opaques) : aucun calcul inutile
  const updatePause = useCallback(() => {
    const st = getState.current?.();
    if (!st || !readyRef.current) return;
    // Haut de l'accueil (35 % de sa hauteur) ou page de fin opaque : rien à dessiner
    const want = scroll.raw < (INTRO_VH / TOTAL_VH) * 0.35 || scroll.end > 0.995 ? "never" : "always";
    if (st.frameloop === want) return;
    st.setFrameloop(want);
    if (want === "always") st.invalidate();
  }, []);

  useEffect(() => {
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
        updatePause();
      },
    });
    const onMove = (e: PointerEvent) => {
      scroll.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      scroll.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => { st.kill(); window.removeEventListener("pointermove", onMove); };
  }, [updatePause]);

  // Progression du téléchargement (modèle, images) pour l'écran d'accueil
  useEffect(
    () => useProgress.subscribe((s) => {
      if (s.total > 0) loading.phase("download", s.loaded / s.total);
    }),
    [],
  );

  const onReady = useCallback(() => {
    readyRef.current = true;
    setReady(true);
    loading.set({ progress: 1, ceiling: 1, ready: true });
    const st = getState.current?.();
    if (st) { st.setFrameloop("always"); st.invalidate(); }
    // Deux images pour tout mettre en place, puis pause si l'accueil couvre encore l'écran
    requestAnimationFrame(() => requestAnimationFrame(updatePause));
  }, [updatePause]);

  const onCreated = useCallback((state: RootState) => {
    getState.current = state.get;
    if (process.env.NODE_ENV !== "production") Object.assign(window, { __gl: state.gl, __r3f: state.get });
    // La vraie carte graphique est connue : on affine le niveau avant le premier rendu (rien n'est encore compilé)
    const ctx = state.gl.getContext();
    const dbg = ctx.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(ctx.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : ctx.RENDERER) ?? "");
    const tier = refineTier(quality.get().tier, renderer);
    if (tier === "classic") { onFail(); return; }
    if (tier !== quality.get().tier) quality.set(qualityFor(tier, mobile));
    const qq = quality.get();
    if (qq.shadows && qq.softShadows && !mobile) applySoftShadows(state.gl);
    // Contexte 3D perdu (mémoire saturée sur un vieux téléphone…) et non rétabli : version simple
    let lost = 0;
    state.gl.domElement.addEventListener("webglcontextlost", () => { lost = window.setTimeout(onFail, 4000); });
    state.gl.domElement.addEventListener("webglcontextrestored", () => window.clearTimeout(lost));
    setGpuChecked(true);
  }, [mobile, onFail]);

  // La scène ne se reconstruit que si le thème, la langue ou le format changent
  const world = useMemo(() => <World sunset={theme === "dark"} mobile={mobile} lang={lang} />, [theme, mobile, lang]);
  const shadows = q.shadows && !mobile ? (q.softShadows ? "basic" : "soft") : false;

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        dpr={dpr}
        frameloop="never"
        shadows={shadows}
        camera={{ fov: mobile ? 50 : 36, near: 0.1, far: 80, position: [4, 3, 6] }}
        gl={{ antialias: q.antialias, powerPreference: "high-performance", toneMappingExposure: 1.06 }}
        onCreated={onCreated}
      >
        {/*
          Si les images ralentissent vraiment (< 26 par seconde), on baisse seulement la résolution : jamais de contenu
          retiré en cours de visite (figurants, ciel, herbe restent tels que choisis au chargement). Le seuil est sous
          30 images/s car un Mac en économie d'énergie plafonne le navigateur à 30 sans que le site peine.
        */}
        {ready && (
          <PerformanceMonitor
            bounds={() => [26, 50]}
            onDecline={() => setDpr((d) => Math.max(minDpr, +(d - 0.25).toFixed(2)))}
            onIncline={() => setDpr((d) => Math.min(quality.get().dprMax, +(d + 0.25).toFixed(2)))}
            flipflops={4}
            onFallback={() => setDpr(minDpr)}
          />
        )}
        {gpuChecked && (
          <Suspense fallback={null}>
            <Assets>
              {world}
              <Warmup onReady={onReady} />
            </Assets>
          </Suspense>
        )}
      </Canvas>
      <div className="story-grade" aria-hidden />
    </div>
  );
}
