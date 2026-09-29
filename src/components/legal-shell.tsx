import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="atmosphere" aria-hidden />
      <header className="mx-auto max-w-3xl px-5 pt-8">
        <Link href="/" className="inline-flex min-h-[44px] items-center gap-2 text-sm text-mute hover:text-ink">
          <ArrowLeft size={16} /> indyfrancois.com
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-8">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <div className="prose-legal mt-8">{children}</div>
      </main>
    </>
  );
}
