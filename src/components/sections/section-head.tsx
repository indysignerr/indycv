import { Reveal } from "@/components/ui/reveal";

export function SectionHead({ label, title }: { label: string; title: string }) {
  return (
    <Reveal className="mb-12 max-w-3xl">
      <p className="label mb-4 text-accent">{label}</p>
      <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{title}</h2>
    </Reveal>
  );
}
