"use client";

import { useEffect, useState } from "react";
import { SITE, type Lang } from "@/lib/content";
import { cv } from "@/lib/cv";

/**
 * CV A4 (une page), rendu à /cv/?lang=fr|en puis converti en PDF (scripts/build-cv-pdf.mjs).
 * Mise en page : bandeau avec nom et poste, colonne sombre (photo, contact, profil, langues, compétences, loisirs),
 * colonne claire (expériences, projet, formation) avec repères de section à cheval sur les deux colonnes.
 * Couleurs du site : vermillon #FF5A36, encre #14121A, colonne #16161E.
 */
const ACCENT = "#FF5A36";

export function PrintCv() {
  const [lang, setLang] = useState<Lang>("fr");
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    const q = new URLSearchParams(window.location.search).get("lang");
    if (q === "en" || q === "fr") setLang(q);
  }, []);
  const c = cv[lang];

  const Side = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-[6.5mm]">
      <h2 className="mb-[2.6mm] font-display text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>{title}</h2>
      {children}
    </section>
  );
  const Main = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="relative mb-[8mm]">
      {/* Repère à cheval sur la frontière des deux colonnes */}
      <span aria-hidden className="absolute left-[-12.2mm] top-[0.8mm] h-[4.4mm] w-[4.4mm] rounded-full border-[1.6px] border-white" style={{ background: ACCENT }} />
      <h2 className="mb-[3.6mm] font-display text-[16px] font-bold uppercase tracking-[0.06em]">{title}</h2>
      {children}
    </section>
  );
  const Item = ({ e }: { e: (typeof c.experience)[number] }) => (
    <article className="mb-[4.8mm] break-inside-avoid">
      <h3 className="font-display text-[14px] font-bold leading-tight">{e.title}</h3>
      <p className="mt-[0.8mm] text-[11.2px]">
        <span className="font-semibold italic">{e.org}</span>
        <span className="font-mono text-[10px] text-[#77727F]"> | {e.period}</span>
      </p>
      {e.bullets.length > 0 && (
        <ul className="mt-[2mm] space-y-[1.3mm]">
          {e.bullets.map((b) => (
            <li key={b} className="relative pl-[4mm] text-[11px] leading-[1.45] text-[#2A2730]">
              <span aria-hidden className="absolute left-[0.6mm] top-[2.1mm] h-[1.3mm] w-[1.3mm] rounded-full" style={{ background: ACCENT }} />
              {b}
            </li>
          ))}
        </ul>
      )}
    </article>
  );

  return (
    <div data-cv-ready className="relative mx-auto h-[297mm] w-[210mm] overflow-hidden bg-white font-display text-[#14121A]">
      {/* Bandeau et colonne sombre */}
      <div className="absolute inset-x-0 top-0 h-[42mm]" style={{ background: ACCENT }} />
      <div className="absolute bottom-0 left-0 top-[42mm] w-[70mm] bg-[#16161E]" />

      {/* Photo, à cheval sur le bandeau et la colonne */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/indy-photo.jpg" alt="Indy François" className="absolute left-[9mm] top-[8mm] h-[64mm] w-[52mm] rounded-[2mm] object-cover shadow-[0_2mm_6mm_rgba(0,0,0,0.25)]" style={{ objectPosition: "50% 24%" }} />

      {/* Nom et poste */}
      <header className="absolute left-[80mm] right-[10mm] top-[9mm]">
        <h1 className="text-[33px] font-extrabold uppercase leading-none tracking-[0.01em]">Indy François</h1>
        <p className="mt-[2.6mm] text-[13px] font-semibold uppercase tracking-[0.05em]">{c.role}</p>
        <p className="mt-[2mm] inline-block rounded-full bg-[#14121A] px-[3mm] py-[0.9mm] font-mono text-[9.5px] text-white">{c.availability}</p>
      </header>

      {/* Colonne sombre */}
      <aside className="absolute left-0 top-[80mm] w-[70mm] px-[8.5mm] text-[#EDEAE4]">
        <Side title={c.labels.contact}>
          {/* Liens cliquables dans le PDF */}
          <ul className="space-y-[1.5mm] text-[10.6px] leading-snug">
            <li><a href={`tel:${SITE.phoneHref}`}>{SITE.phone}</a></li>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li><a href={SITE.url}>indyfrancois.com</a></li>
            <li className="whitespace-nowrap text-[9.4px] tracking-[-0.01em]"><a href={SITE.linkedin}>linkedin.com/in/indy-françois-37a451284</a></li>
            <li><a href={SITE.github}>github.com/indysignerr</a></li>
          </ul>
        </Side>
        <Side title={c.labels.profile}>
          <p className="text-[10.6px] leading-[1.55] text-[#DAD6CF]">{c.profile}</p>
        </Side>
        <Side title={c.labels.languages}>
          <ul className="space-y-[2.6mm]">
            {c.languages.map((l) => (
              <li key={l.name} className="text-[10.6px]">
                <p className="mb-[1.2mm] flex items-baseline justify-between gap-[2mm]">
                  <span>{l.name}</span>
                  <span className="font-mono text-[8.8px] text-[#A9A4AE]">{l.level}</span>
                </p>
                <span className="relative block h-[1.6mm] rounded-full bg-white/15">
                  <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${l.value * 100}%`, background: ACCENT }} />
                </span>
              </li>
            ))}
          </ul>
        </Side>
        <Side title={c.labels.skills}>
          <ul className="space-y-[1.3mm] text-[10.6px] leading-snug">{c.skills.map((s) => <li key={s}>{s}</li>)}</ul>
        </Side>
        <Side title={c.labels.interests}>
          <ul className="space-y-[1.3mm] text-[10.6px] leading-snug">{c.interests.map((s) => <li key={s}>{s}</li>)}</ul>
        </Side>
      </aside>

      {/* Colonne claire */}
      <main className="absolute left-[70mm] right-0 top-[51mm] px-[10mm]">
        <Main title={c.labels.experience}>{c.experience.map((e) => <Item key={e.title} e={e} />)}</Main>
        <Main title={c.labels.project}><Item e={c.project} /></Main>
        <Main title={c.labels.education}>{c.education.map((e) => <Item key={e.title} e={e} />)}</Main>
      </main>
    </div>
  );
}
