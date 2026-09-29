"use client";

import { Code2, Mail, Phone, UserRound } from "lucide-react";
import { useApp } from "@/components/providers";
import { Reveal } from "@/components/ui/reveal";
import { SITE, tr, ui } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Contact() {
  const { lang } = useApp();
  return (
    <section id="contact" className="mx-auto max-w-6xl px-5 pb-24 pt-24 lg:px-8">
      <SectionHead label={tr(ui.contact.label, lang)} title={tr(ui.contact.title, lang)} />
      <Reveal className="rounded-[2rem] border hairline bg-surface/70 p-8 backdrop-blur sm:p-12">
        <p className="max-w-xl text-lg text-ink/75">{tr(ui.contact.text, lang)}</p>
        <a href={`mailto:${SITE.email}`} className="mt-6 block break-all font-serif text-3xl italic text-accent underline-offset-8 hover:underline sm:text-5xl">
          {SITE.email}
        </a>
        <ul className="mt-10 flex flex-wrap gap-3">
          <li><a className="btn-primary" href={`mailto:${SITE.email}`}><Mail size={18} />{tr(ui.hero.cta, lang)}</a></li>
          <li><a className="btn-ghost" href={`tel:${SITE.phoneHref}`}><Phone size={18} />{SITE.phone}</a></li>
          <li><a className="btn-ghost" href={SITE.linkedin} target="_blank" rel="noopener noreferrer"><UserRound size={18} />LinkedIn</a></li>
          <li><a className="btn-ghost" href={SITE.github} target="_blank" rel="noopener noreferrer"><Code2 size={18} />GitHub</a></li>
        </ul>
      </Reveal>
    </section>
  );
}
