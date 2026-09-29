"use client";

import { useEffect, useRef } from "react";
import { scroll } from "@/lib/scroll-progress";

/**
 * Curseur personnalisé (souris uniquement) : un point exact + un anneau qui suit avec un léger retard.
 * L'anneau grossit sur les liens et boutons, et prend la couleur du lieu sur les points cliquables de la 3D.
 * En mode « différence », il reste visible sur un ciel clair comme sur un fond sombre.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const d = dot.current!, r = ring.current!;
    const html = document.documentElement;
    let x = -100, y = -100, rx = -100, ry = -100, s = 1, shown = false, over = false, down = false, raf = 0, state = "";
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX; y = e.clientY;
      if (!shown) { rx = x; ry = y; shown = true; html.classList.add("has-cursor"); }
    };
    const overFn = (e: PointerEvent) => { over = !!(e.target as Element | null)?.closest?.("a, button, [role='button'], summary, label"); };
    const leave = () => { shown = false; };
    const press = () => { down = true; };
    const release = () => { down = false; };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", overFn, { passive: true });
    html.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    const loop = () => {
      rx += (x - rx) * 0.22; ry += (y - ry) * 0.22;
      const hot = scroll.cursor === "hotspot";
      const target = down ? 0.75 : hot ? 1.5 : over ? 1.6 : 1;
      s += (target - s) * 0.2;
      const next = hot ? "hot" : over ? "over" : "";
      if (next !== state) { state = next; r.dataset.state = next; }
      d.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${over || hot ? 0 : 1})`;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
      const o = shown ? "1" : "0";
      if (r.style.opacity !== o) { r.style.opacity = o; d.style.opacity = o; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", overFn);
      html.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, []);
  return (
    <>
      <div ref={ring} aria-hidden className="cursor-ring" />
      <div ref={dot} aria-hidden className="cursor-dot" />
    </>
  );
}
