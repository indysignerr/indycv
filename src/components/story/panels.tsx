"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, ChevronDown, Download, Mail, RotateCcw, X } from "lucide-react";
import { hotspots } from "@/lib/hotspots";
import { useApp } from "@/components/providers";
import { scroll, INTRO_VH, END_VH, TOTAL_VH } from "@/lib/scroll-progress";
import { chapters, PATH_LENGTH, storyUi, t } from "@/lib/story";
import { SITE } from "@/lib/content";
import { ambience } from "@/lib/ambience";

/**
 * Panneaux latéraux : un par chapitre, affiché seulement quand le personnage est dans la pièce.
 * Toujours à droite (desktop) ou en bas (mobile) : jamais devant le personnage.
 */
export function Panels() {
  const { lang, theme } = useApp();
  const [chapter, setChapter] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [endO, setEndO] = useState(0);
  const [hotspot, setHotspot] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setOpen(false);
    if (chapter < 0) { setFlash(false); return; }
    setFlash(true);
    const id = setTimeout(() => setFlash(false), 3200);
    return () => clearTimeout(id);
  }, [chapter]);
  // Aller au milieu d'un chapitre (scroll animé)
  const goTo = (i: number) => {
    const ch = chapters[i];
    const story = (ch.at + ch.length / 2) / PATH_LENGTH;
    const a = INTRO_VH / TOTAL_VH, b = END_VH / TOTAL_VH;
    const raw = a + story * (1 - a - b);
    const y = raw * (document.documentElement.scrollHeight - window.innerHeight);
    if (scroll.lenis) scroll.lenis.scrollTo(y, { duration: 2.4, easing: (x: number) => 1 - Math.pow(1 - x, 3) });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setChapter((c) => (c === scroll.chapter ? c : scroll.chapter));
      setProgress((p) => (Math.abs(p - scroll.progress) > 0.002 ? scroll.progress : p));
      setEndO((o) => (Math.abs(o - scroll.end) > 0.01 || (scroll.end === 0 && o !== 0) ? scroll.end : o));
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
  // Petit son à l'ouverture / fermeture d'une fiche (si le son est activé)
  const prevHotspot = useRef<string | null>(null);
  useEffect(() => {
    if (hotspot && !prevHotspot.current) ambience.ui("open");
    else if (!hotspot && prevHotspot.current) ambience.ui("close");
    prevHotspot.current = hotspot;
  }, [hotspot]);
  const atEnd = endO > 0.01;

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* Marque + compteur de chapitre */}
      <div className="absolute left-5 top-5 flex items-center gap-4 sm:left-8 sm:top-6" style={{ color: "var(--story-ink, #fff)" }}>
        <span className="font-display text-lg font-bold drop-shadow-sm">IF<span style={{ color: "var(--story-accent, rgb(var(--accent)))" }}>.</span></span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] opacity-80 drop-shadow-sm">
          {c ? `${String(chapter + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}` : lang === "fr" ? "En chemin" : "On the way"}
        </span>
      </div>
      {/* Barre fine (mobile) */}
      <div className="absolute left-5 right-5 top-14 h-[2px] overflow-hidden rounded-full bg-white/25 md:hidden">
        <div className="h-full origin-left rounded-full" style={{ transform: `scaleX(${progress})`, background: "var(--story-accent, rgb(var(--accent)))" }} />
      </div>
      {/* Rail des chapitres (desktop) : colonne de numéros, nom au survol */}
      <nav aria-label={lang === "fr" ? "Chapitres" : "Chapters"} className="pointer-events-auto absolute left-6 top-1/2 hidden -translate-y-1/2 md:block">
        <div className="relative flex flex-col items-center gap-1 rounded-full border border-white/10 bg-[rgba(14,14,20,0.42)] px-1.5 py-3 backdrop-blur-md" style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}>
          {chapters.map((ch, i) => {
            const on = i === chapter;
            const done = progress * PATH_LENGTH > ch.at + ch.length;
            return (
              <button key={ch.id} type="button" onClick={() => goTo(i)} aria-label={t(ch.title, lang)} aria-current={on ? "step" : undefined}
                className="group relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10">
                <span className="font-mono text-[10px] tracking-[0.12em] transition-all duration-300"
                  style={{ color: on ? "var(--story-accent)" : "#fff", opacity: on ? 1 : done ? 0.85 : 0.5, transform: on ? "scale(1.15)" : "none" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {on && <span className="absolute -left-[5px] h-4 w-[2px] rounded-full" style={{ background: "var(--story-accent)" }} />}
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-full bg-[rgba(14,14,20,0.78)] px-3 py-1.5 font-display text-xs font-semibold text-white opacity-0 backdrop-blur-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" style={{ transform: "translateX(-4px)" }}>
                  {t(ch.title, lang)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      {/* Titre cinématique à l'entrée d'une pièce */}
      <AnimatePresence>
        {c && flash && (
          <motion.div key={`t-${c.id}`} className="absolute left-1/2 top-20 max-w-[88vw] -translate-x-1/2 rounded-2xl border border-white/10 px-7 py-5 text-center backdrop-blur-xl sm:top-24" style={{ background: "var(--story-panel)", boxShadow: "0 24px 70px rgba(0,0,0,0.3)" }} initial="hide" animate="show" exit="hide" variants={{ show: { opacity: 1, transition: { staggerChildren: 0.08 } }, hide: { opacity: 0, transition: { staggerChildren: 0.04, staggerDirection: -1, delay: 0.25 } } }}>
            <div className="overflow-hidden"><motion.p variants={{ hide: { y: "110%" }, show: { y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } }} className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: "var(--story-accent)" }}>{t(c.label, lang)}</motion.p></div>
            <div className="overflow-hidden pb-1"><motion.h2 variants={{ hide: { y: "110%" }, show: { y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } } }} className="mt-2 font-display text-[clamp(1.8rem,3.6vw,3rem)] font-extrabold leading-none tracking-tight text-white">{t(c.title, lang)}</motion.h2></div>
            <div className="overflow-hidden"><motion.p variants={{ hide: { y: "110%" }, show: { y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }} className="mt-2 font-serif text-xl italic text-white/85">{t(c.quality, lang)}</motion.p></div>
          </motion.div>
        )}
      </AnimatePresence>
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
        {c && !hs && !flash && (
          <motion.aside
            key={c.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40, transition: { duration: 0.35 } }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto absolute bottom-3 left-3 right-3 max-h-[38vh] overflow-y-auto rounded-2xl border border-white/10 p-4 backdrop-blur-xl sm:bottom-8 sm:left-auto sm:right-8 sm:max-h-none sm:w-[340px] sm:p-5"
            style={{ background: "var(--story-panel)", color: "var(--story-ink)", boxShadow: "0 24px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)" }}
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
          <motion.div key="end" initial={false} exit={{ opacity: 0 }} style={{ opacity: endO }} className="story-cover story-cover--end pointer-events-auto absolute inset-0 flex flex-col">
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
