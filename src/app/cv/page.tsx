import type { Metadata } from "next";
import { PrintCv } from "@/components/print-cv";

export const metadata: Metadata = { title: "CV — Indy François", robots: { index: false, follow: false } };

export default function Page() {
  return <PrintCv />;
}
