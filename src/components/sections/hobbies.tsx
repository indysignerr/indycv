"use client";

import { useApp } from "@/components/providers";
import { Reveal } from "@/components/ui/reveal";
import { hobbies, tr, ui } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Hobbies() {
  const { lang } = useApp();
  return (
    <section id="hobbies" className="mx-auto max-w-6xl px-5 py-24 lg:px-8">
      <SectionHead label={tr(ui.hobbies.label, lang)} title={tr(ui.hobbies.title, lang)} />
      <Reveal as="ul" stagger className="grid gap-px overflow-hidden rounded-3xl border hairline bg-[rgb(var(--ink)/0.08)] sm:grid-cols-2 lg:grid-cols-4">
        {hobbies.map((h, i) => (
          <li key={h.name.fr} className="bg-bg p-7 transition-colors hover:bg-surface">
            <p className="label">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-10 font-display text-3xl font-bold">{tr(h.name, lang)}</h3>
            <p className="mt-2 text-mute">{tr(h.text, lang)}</p>
          </li>
        ))}
      </Reveal>
    </section>
  );
}
