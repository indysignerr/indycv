"use client";

import { useEffect, useRef } from "react";

/** Balle de tennis qui suit le curseur (desktop, hors reduced-motion). */
export function TennisBall() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || !fine || calm) return;
    let x = -100, y = -100, tx = -100, ty = -100, raf = 0, rot = 0;
    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.style.opacity = "1";
    };
    const loop = () => {
      x += (tx - x) * 0.14;
      y += (ty - y) * 0.14;
      rot += (tx - x) * 0.6;
      el.style.transform = `translate3d(${x - 11}px, ${y - 11}px, 0) rotate(${rot}deg)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("pointermove", move);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-50 hidden h-[22px] w-[22px] opacity-0 transition-opacity duration-500 [@media(pointer:fine)]:block"
    >
      <svg viewBox="0 0 22 22" width="22" height="22">
        <circle cx="11" cy="11" r="10" fill="#D7F03B" />
        <path d="M3 5c4 3 4 9 0 12M19 5c-4 3-4 9 0 12" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
