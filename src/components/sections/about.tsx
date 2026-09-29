"use client";

import { useApp } from "@/components/providers";
import { Reveal } from "@/components/ui/reveal";
import { timeline, tr, ui } from "@/lib/content";
import { SectionHead } from "./section-head";

export function About() {
  const { lang } = useApp();
  return (
    <section id="about" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <SectionHead label={tr(ui.about.label, lang)} title={tr(ui.about.title, lang)} />
      <Reveal as="ol" stagger className="relative space-y-2 border-l hairline pl-6 sm:pl-10">
        {timeline.map((t, i) => (
          <li key={i} className="relative grid gap-2 py-6 md:grid-cols-[200px_1fr] md:gap-10">
            <span aria-hidden className={`absolute -left-[31px] top-8 h-3 w-3 rounded-full sm:-left-[47px] ${i < 2 ? "bg-accent" : "bg-mute"}`} />
            <p className="label pt-1">{tr(t.period, lang)}</p>
            <div>
              <h3 className="font-display text-2xl font-semibold">{tr(t.title, lang)}</h3>
              <p className="mt-1 font-serif text-lg italic text-accent">{tr(t.sub, lang)}</p>
              <p className="mt-2 max-w-2xl text-ink/70">{tr(t.text, lang)}</p>
            </div>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
