"use client";

import { Moon, Sun } from "lucide-react";
import { useApp } from "@/components/providers";
import { tr, ui } from "@/lib/content";
import { switchView } from "@/lib/view";

const links = ["about", "projects", "skills", "hobbies", "contact"] as const;

export function Navbar() {
  const { lang, setLang, theme, toggleTheme } = useApp();
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <nav
        aria-label="Navigation principale"
        className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-full border hairline bg-bg/70 px-4 py-2 backdrop-blur-xl sm:mx-6 lg:mx-auto"
      >
        <a href="#top" aria-label="Indy François" className="flex h-11 items-center px-2 font-display text-lg font-bold tracking-tight">
          IF<span className="text-accent">.</span>
        </a>
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((k) => (
            <li key={k}>
              <a href={`#${k}`} className="flex min-h-[44px] items-center rounded-full px-4 text-sm text-mute transition-colors hover:text-ink">
                {tr(ui.nav[k], lang)}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => switchView("full")} className="hidden min-h-[44px] items-center rounded-full px-3 font-mono text-xs uppercase tracking-widest text-mute transition-colors hover:text-ink sm:flex">
            {tr(ui.view.full, lang)}
          </button>
          <button
            type="button"
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label={tr(ui.langSwitch, lang)}
            className="flex h-11 min-w-[44px] items-center justify-center rounded-full px-3 font-mono text-xs uppercase tracking-widest text-mute transition-colors hover:text-ink"
          >
            {lang === "fr" ? "EN" : "FR"}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={tr(theme === "dark" ? ui.theme.toLight : ui.theme.toDark, lang)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-mute transition-colors hover:text-ink"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>
    </header>
  );
}
