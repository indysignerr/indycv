"use client";

import { useEffect, useState } from "react";
import { SITE, hobbies, languages, projects, skills, timeline, tr, ui, type Lang } from "@/lib/content";

/** Version A4 du CV, rendue à /cv/?lang=fr|en et convertie en PDF au build (scripts/build-cv-pdf.mjs). */
export function PrintCv() {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "en" || q === "fr") setLang(q);
  }, []);

  const H = ({ children }: { children: React.ReactNode }) => (
    <h2 className="mb-2 mt-5 border-b border-black/20 pb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#C93A18]">{children}</h2>
  );

  return (
    <div data-cv-ready className="mx-auto min-h-[297mm] w-[210mm] bg-white p-[14mm] text-[10px] leading-snug text-[#14121A]">
      <header className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-[30px] font-extrabold leading-none tracking-tight">Indy François</h1>
          <p className="mt-2 font-serif text-[15px] italic text-[#C93A18]">{tr(ui.hero.line1, lang)} {tr(ui.hero.line2, lang)}</p>
          <p className="mt-2 max-w-[120mm]">{tr(ui.hero.intro, lang)}</p>
        </div>
        <ul className="shrink-0 space-y-0.5 text-right font-mono text-[9px]">
          <li>{SITE.email}</li>
          <li>{SITE.phone}</li>
          <li>github.com/indysignerr</li>
          <li>linkedin.com/in/indy-françois-37a451284</li>
          <li>indyfrancois.com</li>
        </ul>
      </header>
      <p className="mt-3 rounded bg-[#F2EFE9] px-2 py-1 font-mono text-[9px]">{tr(ui.hero.availability, lang)}</p>

      <H>{lang === "fr" ? "Parcours" : "Journey"}</H>
      {timeline.map((t, i) => (
        <div key={i} className="mb-1.5 grid grid-cols-[32mm_1fr] gap-3">
          <p className="font-mono text-[9px] text-[#5F5B66]">{tr(t.period, lang)}</p>
          <p><strong>{tr(t.title, lang)}</strong> — {tr(t.sub, lang)}. {tr(t.text, lang)}</p>
        </div>
      ))}

      <H>{tr(ui.projects.label, lang).replace(/^02 — /, "")}</H>
      {projects.map((p) => (
        <div key={p.name} className="mb-1.5">
          <p><strong>{p.name}</strong> <span className="text-[#5F5B66]">· {p.links.map((l) => l.label).join(", ")}</span></p>
          <p>{tr(p.text, lang)}</p>
        </div>
      ))}

      <H>{tr(ui.skills.label, lang).replace(/^03 — /, "")}</H>
      <div className="grid grid-cols-3 gap-4">
        {skills.map((s) => (
          <div key={s.key}>
            <p className="font-semibold">{tr(s.title, lang)}</p>
            <ul className="list-disc pl-3">{tr(s.items, lang).map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <p className="mt-2">
        <strong>{tr(ui.skills.languages, lang)} :</strong> {languages.map((l) => `${tr(l.name, lang)} (${tr(l.level, lang)})`).join(" · ")}
      </p>

      <H>{tr(ui.hobbies.label, lang).replace(/^04 — /, "")}</H>
      <p>{hobbies.map((h) => `${tr(h.name, lang)} — ${tr(h.text, lang)}`).join(" · ")}</p>
    </div>
  );
}
