"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun, Volume2, VolumeX } from "lucide-react";
import { useApp } from "@/components/providers";
import { scroll } from "@/lib/scroll-progress";
import { tr, ui } from "@/lib/content";
import { ambience } from "@/lib/ambience";

/**
 * Langue + jour/soir : au-dessus de tout (accueil, histoire, page de fin), toujours cliquables.
 * Sur l'accueil et la fin, la pastille prend les couleurs de la page ; dans la 3D, elle reste sombre et translucide.
 */
export function Controls() {
  const { lang, theme, setLang, toggleTheme } = useApp();
  const [cover, setCover] = useState(true);
  const sound = useSyncExternalStore(ambience.subscribe, ambience.getSnapshot, ambience.getServerSnapshot);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const c = scroll.intro > 0.5 || scroll.end > 0.5;
      setCover((v) => (v === c ? v : c));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      data-story-chrome
      className={`pointer-events-auto fixed right-4 top-3 z-40 flex items-center gap-1 rounded-full border px-1 backdrop-blur-md transition-colors duration-500 sm:right-8 sm:top-5 ${
        cover ? "border-ink/10 bg-surface/70 text-ink" : "border-white/10 bg-[rgba(14,14,20,0.5)] text-white"
      }`}
    >
      <button type="button" onClick={() => setLang(lang === "fr" ? "en" : "fr")} aria-label={tr(ui.langSwitch, lang)} className="flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 font-mono text-xs uppercase tracking-widest opacity-90 hover:opacity-100">
        {lang === "fr" ? "EN" : "FR"}
      </button>
      <button type="button" onClick={() => ambience.toggle()} aria-pressed={sound} aria-label={tr(sound ? ui.sound.off : ui.sound.on, lang)} className="flex h-11 w-11 items-center justify-center rounded-full opacity-90 hover:opacity-100">
        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <button type="button" onClick={toggleTheme} aria-label={tr(theme === "dark" ? ui.theme.toLight : ui.theme.toDark, lang)} className="flex h-11 w-11 items-center justify-center rounded-full opacity-90 hover:opacity-100">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
}
