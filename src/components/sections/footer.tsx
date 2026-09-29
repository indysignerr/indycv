"use client";

import Link from "next/link";
import { useApp } from "@/components/providers";
import { tr, ui } from "@/lib/content";

export function Footer() {
  const { lang } = useApp();
  return (
    <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t hairline px-5 py-8 text-sm text-mute lg:px-8">
      <p>© {new Date().getFullYear()} Indy François · {tr(ui.footer.rights, lang)}</p>
      <nav aria-label="Footer" className="flex gap-2">
        <Link href="/mentions-legales/" className="flex min-h-[44px] items-center px-2 hover:text-ink">{tr(ui.footer.legal, lang)}</Link>
        <Link href="/politique-de-confidentialite/" className="flex min-h-[44px] items-center px-2 hover:text-ink">{tr(ui.footer.privacy, lang)}</Link>
      </nav>
    </footer>
  );
}
