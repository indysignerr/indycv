"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Download, Mail, Moon, RotateCcw, Sun, X } from "lucide-react";
import { hotspots } from "@/lib/hotspots";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { chapters, storyUi, t } from "@/lib/story";
import { SITE, tr, ui } from "@/lib/content";

/**
 * Panneaux latéraux : un par chapitre, affiché seulement quand le personnage est dans la pièce.
 * Toujours à droite (desktop) ou en bas (mobile) : jamais devant le personnage.
 */
export function Panels() {
  const { lang, theme, setLang, toggleTheme } = useApp();
  const [chapter, setChapter] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [hotspot, setHotspot] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [chapter]);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setChapter((c) => (c === scroll.chapter ? c : scroll.chapter));
      setProgress((p) => (Math.abs(p - scroll.progress) > 0.002 ? scroll.progress : p));
      setHotspot((h) => (h === scroll.hotspot ? h : scroll.hotspot));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Palette du chapitre → variables CSS globales (fondu géré par la transition CSS)
  useEffect(() => {
    const root = document.documentElement;
    if (chapter < 0) { root.style.removeProperty("--story-accent"); root.style.removeProperty("--story-panel"); root.style.removeProperty("--story-ink"); return; }
    const p = theme === "dark" ? chapters[chapter].sunset : chapters[chapter].day;
    root.style.setProperty("--story-accent", p.accent);
    root.style.setProperty("--story-panel", p.panel);
    root.style.setProperty("--story-ink", p.ink);
  }, [chapter, theme]);

  const c = chapter >= 0 ? chapters[chapter] : null;
  const hs = hotspot ? hotspots.find((h) => h.id === hotspot) ?? null : null;
  useEffect(() => { if (hs && hs.chapter !== c?.id) scroll.hotspot = null; }, [hs, c]);
  const atEnd = progress > 0.975;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Barre de progression + rappel scroll */}
      <div className="absolute left-5 top-5 flex items-center gap-3 sm:left-8 sm:top-6">
        <span className="font-display text-lg font-bold" style={{ color: "var(--story-ink, rgb(var(--ink)))" }}>IF<span style={{ color: "var(--story-accent, rgb(var(--accent)))" }}>.</span></span>
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${progress * 100}%`, background: "var(--story-accent, rgb(var(--accent)))" }} />
        </div>
      </div>
      {/* Langue + jour/soir, toujours accessibles */}
      <div className="pointer-events-auto absolute right-4 top-3 flex items-center gap-1 rounded-full bg-black/25 px-1 backdrop-blur-md sm:right-8 sm:top-5">
        <button type="button" onClick={() => setLang(lang === "fr" ? "en" : "fr")} aria-label={tr(ui.langSwitch, lang)} className="flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 font-mono text-xs uppercase tracking-widest text-white/90 hover:text-white">
          {lang === "fr" ? "EN" : "FR"}
        </button>
        <button type="button" onClick={toggleTheme} aria-label={tr(theme === "dark" ? ui.theme.toLight : ui.theme.toDark, lang)} className="flex h-11 w-11 items-center justify-center rounded-full text-white/90 hover:text-white">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {hs && (
          <motion.aside key={hs.id} initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, transition: { duration: 0.25 } }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-3 left-3 right-3 z-10 max-h-[70vh] overflow-y-auto rounded-3xl p-6 backdrop-blur-xl sm:bottom-auto sm:left-auto sm:right-8 sm:top-1/2 sm:w-[420px] sm:-translate-y-1/2 sm:p-8"
            style={{ background: "var(--story-panel)", color: "var(--story-ink)", boxShadow: "0 30px 80px rgba(0,0,0,0.4)" }}>
            <button type="button" onClick={() => { scroll.hotspot = null; }} aria-label="Fermer" className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10"><X size={18} /></button>
            <p className="label pr-12" style={{ color: "var(--story-accent)" }}>{t(hs.kicker, lang)}</p>
            <h3 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-3xl">{t(hs.title, lang)}</h3>
            <ul className="mt-4 space-y-2 text-[15px] leading-relaxed opacity-90">
              {t(hs.lines, lang).map((l) => <li key={l} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--story-accent)" }} />{l}</li>)}
            </ul>
            {hs.links && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {hs.links.map((l) => <li key={l.href}><a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-current/30 px-3 text-sm hover:bg-white/10">{l.label}<ArrowUpRight size={14} aria-hidden /></a></li>)}
              </ul>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {c && !hs && (
          <motion.aside
            key={c.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.35 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-3 left-3 right-3 max-h-[38vh] overflow-y-auto rounded-2xl p-4 backdrop-blur-xl sm:bottom-8 sm:left-auto sm:right-8 sm:max-h-none sm:w-[340px] sm:p-5"
            style={{ background: "var(--story-panel)", color: "var(--story-ink)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
          >
            <p className="label" style={{ color: "var(--story-accent)" }}>{t(c.label, lang)}</p>
            <h2 className="mt-1.5 font-display text-xl font-bold leading-tight sm:text-2xl">{t(c.title, lang)}</h2>
            <p className="mt-0.5 font-serif text-base italic opacity-80">{t(c.quality, lang)}</p>
            <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mt-2 inline-flex min-h-[40px] items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] opacity-80 hover:opacity-100">
              {open ? (lang === "fr" ? "Réduire" : "Less") : (lang === "fr" ? "Lire" : "Read")} <ChevronDown size={14} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {open && <p className="mt-2 text-[14px] leading-relaxed opacity-90">{t(c.text, lang)}</p>}
            {hotspots.some((h) => h.chapter === c.id) && (
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] opacity-60">{lang === "fr" ? "Cliquez sur les points lumineux" : "Click the glowing dots"}</p>
            )}
            {c.links && open && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-1 rounded-full border border-current/30 px-3 text-sm hover:bg-white/10">
                      {l.label}<ArrowUpRight size={14} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {atEnd && (
          <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: "easeInOut" }} className="pointer-events-auto absolute inset-0 flex flex-col bg-bg/85 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 sm:px-8">
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="label mb-6 text-accent">{t(storyUi.endKicker, lang)}</motion.p>
              <motion.h2 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.8 }} className="font-display text-[clamp(1.9rem,5vw,3.6rem)] font-bold leading-[1.08] tracking-tight text-ink">{t(storyUi.endTitle, lang)}</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-6 max-w-xl font-serif text-xl italic text-mute">{t(storyUi.endText, lang)}</motion.p>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mt-10 flex flex-wrap gap-3">
                <a href={`mailto:${SITE.email}`} className="btn-primary"><Mail size={18} /> {SITE.email}</a>
                <a href={`/cv-indy-francois-${lang}.pdf`} download className="btn-ghost"><Download size={18} /> {t(storyUi.cv, lang)}</a>
                <button type="button" onClick={() => scroll.lenis ? scroll.lenis.scrollTo(0, { immediate: true }) : window.scrollTo({ top: 0 })} className="btn-ghost"><RotateCcw size={18} /> {t(storyUi.replay, lang)}</button>
              </motion.div>
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs text-mute">
                <li>{SITE.phone}</li>
                <li><a href={SITE.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">LinkedIn</a></li>
                <li><a href={SITE.github} target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a></li>
                <li><a href="/mentions-legales/" className="hover:text-ink">{lang === "fr" ? "Mentions légales" : "Legal"}</a></li>
              </motion.ul>
            </div>
            <p className="px-5 pb-6 font-mono text-xs text-mute sm:px-8">Indy François · Mines Paris-PSL × Albert School · indyfrancois.com</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
