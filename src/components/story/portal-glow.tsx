"use client";

import { useEffect, useRef } from "react";
import { scroll } from "@/lib/scroll-progress";

/** Halo plein écran au franchissement d'un portique (piloté par le scroll : il se rejoue à l'envers si on remonte). */
export function PortalGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0, last = "";
    const loop = () => {
      const el = ref.current;
      if (el) {
        el.style.opacity = (scroll.portal * 0.3).toFixed(3);
        if (scroll.portalAccent !== last) { last = scroll.portalAccent; el.style.setProperty("--glow", last); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <div ref={ref} aria-hidden className="portal-glow pointer-events-none fixed inset-0 z-[15]" />;
}
