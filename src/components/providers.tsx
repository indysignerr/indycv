"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Lang } from "@/lib/content";

type Theme = "dark" | "light";
type Ctx = { lang: Lang; setLang: (l: Lang) => void; theme: Theme; toggleTheme: () => void };

const AppContext = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used inside <Providers>");
  return c;
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("lang");
    } catch {}
    const initial: Lang = stored === "en" || stored === "fr" ? stored : "fr";
    setLangState(initial);
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
      return next;
    });
  }, []);

  // Lenis (smooth scroll) synchronisé sur le ticker GSAP
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  const value = useMemo(() => ({ lang, setLang, theme, toggleTheme }), [lang, setLang, theme, toggleTheme]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
