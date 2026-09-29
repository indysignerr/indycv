"use client";

import { useEffect, useRef } from "react";
import { ArrowDown, Download } from "lucide-react";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { storyUi, t } from "@/lib/story";

/** Écran d'ouverture : visible en haut de l'histoire, s'efface dès qu'on descend (pas de bouton à cliquer). */
export function Intro() {
  const { lang, theme } = useApp();
  const ref = useRef<HTMLDivElement>(null);

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
      <div className="px-5 pt-5 sm:px-8"><span className="font-display text-lg font-bold">IF<span className="text-accent">.</span></span></div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 sm:px-8">
        <p className="label mb-6 text-accent">{t(storyUi.introKicker, lang)} · {theme === "dark" ? (lang === "fr" ? "Coucher de soleil" : "Sunset") : (lang === "fr" ? "Plein jour" : "Daylight")}</p>
        <h1 className="font-display text-[clamp(1.9rem,5vw,3.6rem)] font-bold leading-[1.08] tracking-tight">{t(storyUi.introTitle, lang)}</h1>
        <p className="mt-6 max-w-xl font-serif text-xl italic text-mute">{t(storyUi.introHint, lang)}</p>
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <a href={`/cv-indy-francois-${lang}.pdf`} download className="btn-ghost pointer-events-auto"><Download size={18} /> {t(storyUi.cv, lang)}</a>
          <span className="label inline-flex animate-bounce items-center gap-2">{t(storyUi.scrollHint, lang)} <ArrowDown size={14} /></span>
        </div>
      </div>
      <p className="px-5 pb-6 font-mono text-xs text-mute sm:px-8">Indy François · Mines Paris-PSL × Albert School · indyfrancois.com</p>
    </div>
  );
}
