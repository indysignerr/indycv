"use client";

import { ArrowUpRight } from "lucide-react";
import { useApp } from "@/components/providers";
import { Reveal } from "@/components/ui/reveal";
import { projects, tr, ui } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Projects() {
  const { lang } = useApp();
  return (
    <section id="projects" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <SectionHead label={tr(ui.projects.label, lang)} title={tr(ui.projects.title, lang)} />
      <Reveal stagger className="grid gap-5 lg:grid-cols-6">
        {projects.map((p, i) => (
          <article
            key={p.name}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl border hairline bg-surface/70 p-7 backdrop-blur transition-colors hover:border-accent/60 ${
              i === 0 ? "lg:col-span-4" : i === 1 ? "lg:col-span-2" : "lg:col-span-6"
            }`}
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl transition-opacity group-hover:opacity-100" aria-hidden />
            <div>
              <p className="label">{String(i + 1).padStart(2, "0")} · {tr(p.kind, lang)}</p>
              <h3 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{p.name}</h3>
              <p className="mt-4 max-w-2xl leading-relaxed text-ink/75">{tr(p.text, lang)}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <ul className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li key={t} className="rounded-full border hairline px-3 py-1 font-mono text-xs text-mute">{t}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {p.links.map((l) => (
                  <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-ink px-4 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5">
                    {l.label}<ArrowUpRight size={16} aria-hidden /><span className="sr-only">{tr(ui.projects.visit, lang)}</span>
                  </a>
                ))}
              </div>
            </div>
          </article>
        ))}
      </Reveal>
    </section>
  );
}
