"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, Download, Mail, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { storyUi, t } from "@/lib/story";
import { ambience } from "@/lib/ambience";
import { SITE, ui, cvFile } from "@/lib/content";
import { switchView } from "@/lib/view";
import { loading, useReady } from "@/lib/loading";

/** Écran d'ouverture : visible en haut de l'histoire, s'efface dès qu'on descend (pas de bouton à cliquer). */
export function Intro() {
  const { lang, theme } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const sound = useSyncExternalStore(ambience.subscribe, ambience.getSnapshot, ambience.getServerSnapshot);
  const ready = useReady();
  // Barre de chargement : affichée image par image (sans passer par React), elle glisse vers l'avancement réel
  const bar = useRef<HTMLDivElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const [done, setDone] = useState(false);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    let raf = 0, last = performance.now(), shown = 0, lastPct = -1, written = 0, writtenAt = 0;
    const loop = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      const el = ref.current;
      if (el) {
        const o = scroll.intro;
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.transform = `translateY(${(1 - o) * -24}px)`;
      }
      if (!finished.current) {
        const s = loading.get();
        // Sans nouvelle, la barre glisse doucement vers le plafond de l'étape (sans l'atteindre) ; dès que
        // l'avancement réel la dépasse, elle le rattrape en douceur. Jamais d'arrêt net, jamais de recul.
        const creep = shown + (s.ceiling - 0.01 - shown) * (1 - Math.exp(-dt * 1.2));
        const goal = s.ready ? 1 : Math.max(s.progress, Math.min(s.ceiling - 0.01, creep));
        // Vitesse bornée : pas de bond même après une image longue
        shown += Math.min(dt * 1.1, Math.max(0, goal - shown) * Math.min(1, dt * (s.ready ? 9 : 6)));
        // La barre est animée par le compositeur (transition CSS sur transform) : elle continue de glisser
        // même quand la page est occupée par la préparation de la 3D. On ne lui donne qu'une nouvelle cible
        // toutes les ~100 ms, qu'elle rejoint en 300 ms.
        if (bar.current && (now - writtenAt > 100 || shown - written > 0.02 || (s.ready && shown > 0.99))) {
          bar.current.style.transform = `scaleX(${Math.max(0.03, shown)})`;
          written = shown;
          writtenAt = now;
        }
        const p = Math.min(100, Math.round(shown * 100));
        if (p !== lastPct) {
          lastPct = p;
          if (pct.current) pct.current.textContent = `${p} %`;
          if (meter.current && (p % 5 === 0 || p === 100)) meter.current.setAttribute("aria-valuenow", String(p));
        }
        if (s.ready && shown > 0.995) { finished.current = true; setDone(true); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={ref} className="story-cover pointer-events-none fixed inset-0 z-30 flex flex-col">
      {/* Bandeau haut aussi haut que la pastille langue/son/thème : le texte ne passe jamais dessous */}
      <div className="flex min-h-[68px] items-start px-5 pt-5 sm:px-8"><span className="font-display text-lg font-bold">IF<span className="text-accent">.</span></span></div>
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-5 sm:px-8">
        <div className="my-auto py-2">
        <p className="label mb-4 text-accent sm:mb-6">{t(storyUi.introKicker, lang)} · {theme === "dark" ? (lang === "fr" ? "Coucher de soleil" : "Sunset") : (lang === "fr" ? "Plein jour" : "Daylight")}</p>
        <h2 className="font-display text-[clamp(1.8rem,4.4vw,3.2rem)] font-bold leading-[1.1] tracking-tight">{t(storyUi.introTitle, lang)}</h2>
        <p className="mt-5 font-serif text-[clamp(1.3rem,2.4vw,1.75rem)] italic text-accent">{t(ui.hero.line1, lang)}</p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">{t(storyUi.introWho, lang)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
          <a href={`mailto:${SITE.email}`} className="btn-primary pointer-events-auto"><Mail size={18} /> {t(storyUi.write, lang)}</a>
          <a href={cvFile(lang).href} download={cvFile(lang).name} className="btn-ghost pointer-events-auto"><Download size={18} /> {t(storyUi.cv, lang)}</a>
          <button type="button" onClick={() => ambience.toggle()} aria-pressed={sound} className="btn-ghost pointer-events-auto">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} {t(sound ? ui.sound.off : ui.sound.on, lang)}
          </button>
        </div>
        {done ? (
          <p className="label mt-8 inline-flex items-center gap-2"><span className="inline-flex animate-bounce items-center gap-2">{t(storyUi.scrollHint, lang)} <ArrowDown size={14} /></span><span className="hidden normal-case tracking-normal sm:inline">· {t(storyUi.introHint, lang)}</span></p>
        ) : (
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
            <div ref={meter} role="progressbar" aria-label={t(storyUi.loading, lang)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} className="h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
              <div ref={bar} className="h-full w-full origin-left bg-accent will-change-transform" style={{ transform: "scaleX(0.03)", transition: "transform 300ms linear" }} />
            </div>
            <p className="label" aria-hidden>{t(storyUi.loading, lang)} · <span ref={pct}>0 %</span></p>
            {slow && <p className="text-xs text-mute">{t(storyUi.loadingSlow, lang)}</p>}
          </div>
        )}
        <button type="button" onClick={() => switchView("simple")} className="pointer-events-auto mt-3 inline-flex min-h-[44px] w-fit items-center font-mono text-xs text-mute underline decoration-mute/40 underline-offset-4 hover:text-ink">{t(ui.view.simple, lang)}</button>
        </div>
      </div>
      <p className="px-5 pb-6 font-mono text-xs text-mute sm:px-8 [@media(max-height:760px)]:hidden">Indy François · Mines Paris-PSL × Albert School · indyfrancois.com</p>
    </div>
  );
}
