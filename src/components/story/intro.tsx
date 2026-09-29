"use client";

import { Download, Moon, Play, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "@/components/providers";
import { storyUi, t } from "@/lib/story";
import { tr, ui } from "@/lib/content";

export function Intro({ ready, onStart }: { ready: boolean; onStart: () => void }) {
  const { lang, setLang, theme, toggleTheme } = useApp();
  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col bg-bg/85 backdrop-blur-md"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.9, ease: "easeInOut" } }}
    >
      <div className="flex items-center justify-between px-5 pt-5 sm:px-8">
        <span className="font-display text-lg font-bold">IF<span className="text-accent">.</span></span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setLang(lang === "fr" ? "en" : "fr")} aria-label={tr(ui.langSwitch, lang)} className="flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 font-mono text-xs uppercase tracking-widest text-mute hover:text-ink">
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <button type="button" onClick={toggleTheme} aria-label={tr(theme === "dark" ? ui.theme.toLight : ui.theme.toDark, lang)} className="flex h-11 w-11 items-center justify-center rounded-full text-mute hover:text-ink">
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 sm:px-8">
        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="label mb-6 text-accent">
          {t(storyUi.introKicker, lang)} · {theme === "dark" ? (lang === "fr" ? "Coucher de soleil" : "Sunset") : (lang === "fr" ? "Plein jour" : "Daylight")}
        </motion.p>
        <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }} className="font-display text-[clamp(1.9rem,5vw,3.6rem)] font-bold leading-[1.08] tracking-tight">
          {t(storyUi.introTitle, lang)}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 max-w-xl font-serif text-xl italic text-mute">
          {t(storyUi.introHint, lang)}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="mt-10 flex flex-wrap gap-3">
          <button type="button" onClick={onStart} disabled={!ready} className="btn-primary disabled:opacity-60">
            <Play size={18} /> {ready ? t(storyUi.start, lang) : t(storyUi.loading, lang)}
          </button>
          <a href={`/cv-indy-francois-${lang}.pdf`} download className="btn-ghost"><Download size={18} /> {t(storyUi.cv, lang)}</a>
        </motion.div>
      </div>
      <p className="px-5 pb-6 font-mono text-xs text-mute sm:px-8">Indy François · Mines Paris-PSL × Albert School · indyfrancois.com</p>
    </motion.div>
  );
}
