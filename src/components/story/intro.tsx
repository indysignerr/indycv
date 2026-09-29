"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, Download, Mail, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { storyUi, t } from "@/lib/story";
import { ambience } from "@/lib/ambience";
import { SITE, ui } from "@/lib/content";
import { switchView } from "@/lib/view";
import { useLoading } from "@/lib/loading";

/** Écran d'ouverture : visible en haut de l'histoire, s'efface dès qu'on descend (pas de bouton à cliquer). */
export function Intro() {
  const { lang, theme } = useApp();
  const ref = useRef<HTMLDivElement>(null);
  const sound = useSyncExternalStore(ambience.subscribe, ambience.getSnapshot, ambience.getServerSnapshot);
  const { progress, ready } = useLoading();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (ready) return;
    const id = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(id);
  }, [ready]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        const o = scroll.intro;
        el.style.opacity = String(o);
        el.style.visibility = o < 0.01 ? "hidden" : "visible";
        el.style.transform = `translateY(${(1 - o) * -24}px)`;
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
        <p className="mt-5 font-serif text-[clamp(1.3rem,2.4vw,1.75rem)] italic text-accent">{t(ui.hero.line1, lang)} {t(ui.hero.line2, lang)}</p>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mute">{t(storyUi.introWho, lang)}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
          <a href={`mailto:${SITE.email}`} className="btn-primary pointer-events-auto"><Mail size={18} /> {t(storyUi.write, lang)}</a>
          <a href={`/cv-indy-francois-${lang}.pdf`} download className="btn-ghost pointer-events-auto"><Download size={18} /> {t(storyUi.cv, lang)}</a>
          <button type="button" onClick={() => ambience.toggle()} aria-pressed={sound} className="btn-ghost pointer-events-auto">
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />} {t(sound ? ui.sound.off : ui.sound.on, lang)}
          </button>
        </div>
        {ready ? (
          <p className="label mt-8 inline-flex items-center gap-2"><span className="inline-flex animate-bounce items-center gap-2">{t(storyUi.scrollHint, lang)} <ArrowDown size={14} /></span><span className="hidden normal-case tracking-normal sm:inline">· {t(storyUi.introHint, lang)}</span></p>
        ) : (
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2" role="status" aria-live="polite">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }} />
            </div>
            <p className="label">{t(storyUi.loading, lang)} · {Math.round(progress * 100)} %</p>
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
