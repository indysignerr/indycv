"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ArrowDown, Download, Mail } from "lucide-react";
import { useApp } from "@/components/providers";
import { Counter } from "@/components/ui/counter";
import { SITE, stats, tr, ui } from "@/lib/content";

export function Hero() {
  const { lang } = useApp();
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power4.out" } })
        .from("[data-h]", { yPercent: 110, duration: 1.1, stagger: 0.12 })
        .from("[data-f]", { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, "-=0.6")
        .from("[data-photo]", { scale: 0.92, opacity: 0, duration: 1.2 }, 0.2);
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="top" className="relative mx-auto grid min-h-[100svh] max-w-6xl content-center gap-12 px-5 pb-16 pt-32 lg:grid-cols-[1.25fr_0.75fr] lg:gap-8 lg:px-8">
      <div>
        <p data-f className="label mb-6">{tr(ui.hero.eyebrow, lang)}</p>
        <h1 className="font-display text-[clamp(2.6rem,8.4vw,6.6rem)] font-extrabold leading-[0.95] tracking-tight">
          {/* « Business, data » puis « & code. » en italique vermillon : le slogan seul, sur deux lignes */}
          <span className="block overflow-hidden pb-2"><span data-h className="block">{tr(ui.hero.line1, lang).split(" & ")[0]}</span></span>
          <span className="block overflow-hidden pb-3"><span data-h className="block font-serif font-normal italic text-accent">& {tr(ui.hero.line1, lang).split(" & ")[1]}</span></span>
        </h1>
        <p data-f className="mt-8 max-w-xl text-lg leading-relaxed text-ink/75">{tr(ui.hero.intro, lang)}</p>
        <p data-f className="mt-5 inline-flex items-center gap-2 rounded-full border hairline bg-surface/60 px-4 py-2 font-mono text-xs text-mute">
          <span className="h-2 w-2 animate-pulse rounded-full bg-accent" aria-hidden />
          {tr(ui.hero.availability, lang)}
        </p>
        <div data-f className="mt-8 flex flex-wrap gap-3">
          <a href={`mailto:${SITE.email}`} className="btn-primary"><Mail size={18} />{tr(ui.hero.cta, lang)}</a>
          <a href={`/cv-indy-francois-${lang}.pdf`} download className="btn-ghost"><Download size={18} />{tr(ui.hero.cv, lang)}</a>
        </div>
      </div>

      <div data-photo className="relative mx-auto w-full max-w-[340px] lg:mx-0 lg:mt-10 lg:max-w-none">
        <div className="absolute -right-3 -top-3 h-full w-full rounded-[2rem] border border-accent/60" aria-hidden />
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] bg-surface">
          <Image src="/images/indy-photo.jpg" alt="Portrait d'Indy François" fill priority sizes="(max-width:1024px) 340px, 380px" className="object-cover object-[50%_28%] grayscale-[0.15]" />
        </div>
        <div className="absolute -bottom-6 -left-4 rounded-2xl border hairline bg-bg/80 px-4 py-3 backdrop-blur-xl sm:-left-8">
          <p className="label">Albert School × Mines</p>
          <p className="font-serif text-xl italic">Bachelor Business & Data</p>
        </div>
      </div>

      <ul data-f className="grid grid-cols-2 gap-6 border-t hairline pt-8 sm:grid-cols-4 lg:col-span-2">
        {stats.map((s) => (
          <li key={s.label.fr}>
            <p className="font-display text-4xl font-bold tabular-nums"><Counter to={s.value} /></p>
            <p className="label mt-1">{tr(s.label, lang)}</p>
          </li>
        ))}
      </ul>

      <a href="#about" className="label absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex" aria-label={tr(ui.hero.scroll, lang)}>
        {tr(ui.hero.scroll, lang)} <ArrowDown size={14} />
      </a>
    </section>
  );
}
