"use client";

import { useApp } from "@/components/providers";
import { Reveal } from "@/components/ui/reveal";
import { languages, skills, tr, ui } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Skills() {
  const { lang } = useApp();
  return (
    <section id="skills" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <SectionHead label={tr(ui.skills.label, lang)} title={tr(ui.skills.title, lang)} />
      <Reveal stagger className="grid gap-5 md:grid-cols-3">
        {skills.map((s, i) => (
          <div key={s.key} className={`rounded-3xl border hairline p-7 ${i === 1 ? "bg-surface md:mt-10" : "bg-surface/40"}`}>
            <h3 className="font-serif text-4xl italic text-accent">{tr(s.title, lang)}</h3>
            <ul className="mt-6 space-y-3">
              {tr(s.items, lang).map((it) => (
                <li key={it} className="flex gap-3 text-ink/80"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </Reveal>
      <Reveal className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
        <p className="label">{tr(ui.skills.languages, lang)}</p>
        {languages.map((l) => (
          <p key={l.name.fr}><span className="font-semibold">{tr(l.name, lang)}</span> <span className="text-mute">· {tr(l.level, lang)}</span></p>
        ))}
      </Reveal>
    </section>
  );
}
