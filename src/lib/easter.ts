import type { Bi } from "./content";
import { scroll } from "./scroll-progress";

/**
 * Petites surprises cachées dans le site. Rien ne tourne tant qu'on ne les déclenche pas :
 * un clic, une touche, puis quelques secondes d'animation au plus.
 */

type Toast = { id: number; text: Bi } | null;
let toast: Toast = null;
let hideTimer = 0;
const listeners = new Set<() => void>();

export const easter = {
  get: () => toast,
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
  /** Message discret en haut de l'écran pendant quelques secondes. */
  toast(text: Bi, ms = 3600) {
    toast = { id: (toast?.id ?? 0) + 1, text };
    listeners.forEach((l) => l());
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => { toast = null; listeners.forEach((l) => l()); }, ms);
  },
  /** Objets déjà trouvés (ex. les balles de tennis), pour les collections. */
  found: new Set<string>(),
  /** Danse de victoire d'Indy + confettis. */
  celebrate(text: Bi) {
    scroll.celebrateUntil = performance.now() + 4800;
    confetti();
    easter.toast(text, 4200);
  },
};

const COLORS = ["#FF5A36", "#FFB27A", "#F5B942", "#D7F03B", "#FFFFFF", "#3E6FB0", "#C46D56"];
/** Confettis en éléments de page animés par le compositeur (aucun coût pour la 3D), puis supprimés. */
function confetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  box.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden";
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("span");
    const w = 6 + Math.random() * 6;
    p.style.cssText = `position:absolute;top:-4vh;left:${Math.random() * 100}%;width:${w}px;height:${w * (0.4 + Math.random() * 0.8)}px;background:${COLORS[i % COLORS.length]};border-radius:${Math.random() > 0.6 ? "50%" : "2px"};will-change:transform`;
    box.appendChild(p);
    p.animate(
      [
        { transform: "translate3d(0,0,0) rotate(0deg)" },
        { transform: `translate3d(${(Math.random() - 0.5) * 240}px, 112vh, 0) rotate(${(Math.random() - 0.5) * 900}deg)` },
      ],
      { duration: 1900 + Math.random() * 1500, delay: Math.random() * 350, easing: "cubic-bezier(.25,.55,.45,1)", fill: "forwards" },
    );
  }
  document.body.appendChild(box);
  window.setTimeout(() => box.remove(), 4200);
}
