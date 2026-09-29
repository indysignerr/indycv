"use client";

import * as THREE from "three";

/**
 * Matières dessinées dans le code (canvas) : même langage visuel partout, aucun fichier à charger.
 * Les textures « de surface » sont en niveaux de clair autour du blanc : la couleur finale vient
 * de `color` sur le matériau (jour / coucher de soleil). Les écrans et affiches sont en couleurs.
 */

const cache = new Map<string, THREE.CanvasTexture>();

function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function make(key: string, size: number, draw: (g: CanvasRenderingContext2D, s: number, r: () => number) => void, opts?: { repeat?: [number, number]; srgb?: boolean; offset?: [number, number] }) {
  const k = `${key}:${size}:${opts?.repeat?.join("x") ?? ""}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  draw(g, size, rng(key.split("").reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7)));
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (opts?.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  if (opts?.offset) t.offset.set(opts.offset[0], opts.offset[1]);
  if (opts?.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(k, t);
  return t;
}

/** Bruit fin : n points de luminosité aléatoire. */
function speckle(g: CanvasRenderingContext2D, s: number, r: () => number, n: number, min: number, max: number, size = 1.4, alpha = 1) {
  for (let i = 0; i < n; i++) {
    const v = Math.round(min + r() * (max - min));
    g.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    const w = size * (0.5 + r());
    g.fillRect(r() * s, r() * s, w, w);
  }
}

/** Terre battue : grain, gravillons, traces de balayage. */
export const clayTex = (repeat: [number, number]) =>
  make("clay", 512, (g, s, r) => {
    g.fillStyle = "rgb(236,236,236)"; g.fillRect(0, 0, s, s);
    speckle(g, s, r, 26000, 190, 255, 1.6);
    speckle(g, s, r, 1800, 140, 180, 2.4);
    speckle(g, s, r, 900, 250, 255, 2.2);
    // traces de filet de balayage (légères bandes)
    for (let y = 0; y < s; y += 6 + r() * 10) {
      g.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`;
      g.fillRect(0, y, s, 1 + r() * 2);
    }
  }, { repeat });

/** Pelouse : brins, touffes, bandes de tonte (2 bandes par répétition). */
export const grassTex = (repeat: [number, number], stripes = true) =>
  make(`grass${stripes ? "s" : ""}`, 512, (g, s, r) => {
    g.fillStyle = "rgb(228,228,228)"; g.fillRect(0, 0, s, s);
    if (stripes) { g.fillStyle = "rgb(250,250,250)"; g.fillRect(0, 0, s, s / 2); }
    for (let i = 0; i < 14000; i++) {
      const x = r() * s, y = r() * s, v = Math.round(170 + r() * 85);
      g.strokeStyle = `rgba(${v},${v},${v},0.9)`;
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 5); g.stroke();
    }
    speckle(g, s, r, 800, 150, 190, 3, 0.6);
  }, { repeat });

/** Parquet : lames de largeur égale, décalées, veinées, joints sombres. */
export const woodTex = (repeat: [number, number], plankPx = 64) =>
  make(`wood${plankPx}`, 512, (g, s, r) => {
    for (let x = 0; x < s; x += plankPx) {
      let y = -r() * 300;
      while (y < s) {
        const len = 180 + r() * 220;
        const base = Math.round(205 + r() * 45);
        g.fillStyle = `rgb(${base},${base},${base})`;
        g.fillRect(x, y, plankPx, len);
        // veines
        for (let k = 0; k < 9; k++) {
          const v = base - 18 - r() * 25;
          g.strokeStyle = `rgba(${v},${v},${v},0.55)`;
          g.lineWidth = 0.6 + r() * 1.2;
          const ox = x + 4 + r() * (plankPx - 8), ph = r() * 6, amp = 1 + r() * 3;
          g.beginPath();
          for (let t = 0; t <= len; t += 6) g.lineTo(ox + Math.sin(t / 40 + ph) * amp, y + t);
          g.stroke();
        }
        // nœud occasionnel
        if (r() < 0.25) { g.fillStyle = `rgba(${base - 50},${base - 50},${base - 50},0.5)`; g.beginPath(); g.ellipse(x + plankPx / 2, y + len / 2, 4, 9, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = "rgba(90,90,90,0.9)"; g.fillRect(x, y + len - 1.5, plankPx, 1.5);
        y += len;
      }
      g.fillStyle = "rgba(80,80,80,0.95)"; g.fillRect(x, 0, 1.5, s);
    }
  }, { repeat });

/** Moquette : fibres fines, légère trame. */
export const carpetTex = (repeat: [number, number]) =>
  make("carpet", 256, (g, s, r) => {
    g.fillStyle = "rgb(225,225,225)"; g.fillRect(0, 0, s, s);
    speckle(g, s, r, 22000, 175, 255, 1);
    for (let y = 0; y < s; y += 4) { g.fillStyle = "rgba(0,0,0,0.035)"; g.fillRect(0, y, s, 1); }
  }, { repeat });

/** Enduit : lisse ou granulé (lycée). */
export const plasterTex = (repeat: [number, number], granular = false) =>
  make(`plaster${granular ? "g" : ""}`, 256, (g, s, r) => {
    g.fillStyle = "rgb(240,240,240)"; g.fillRect(0, 0, s, s);
    speckle(g, s, r, granular ? 16000 : 5000, granular ? 195 : 225, 255, granular ? 1.8 : 1.2);
    if (granular) speckle(g, s, r, 1500, 170, 205, 2.4, 0.8);
  }, { repeat });

/** Sol gris (béton ciré) : nuages doux + micro-grain. */
export const concreteTex = (repeat: [number, number]) =>
  make("concrete", 512, (g, s, r) => {
    g.fillStyle = "rgb(232,232,232)"; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 90; i++) {
      const x = r() * s, y = r() * s, rad = 30 + r() * 90, v = Math.round(210 + r() * 45);
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, `rgba(${v},${v},${v},0.35)`); grd.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    speckle(g, s, r, 9000, 200, 255, 1.2);
  }, { repeat });

/** Tuiles de faux-plafond / carrelage : grille fine. */
export const tileTex = (repeat: [number, number]) =>
  make("tile", 256, (g, s, r) => {
    g.fillStyle = "rgb(238,238,238)"; g.fillRect(0, 0, s, s);
    speckle(g, s, r, 3000, 215, 255, 1.2);
    g.fillStyle = "rgba(120,120,120,0.6)"; g.fillRect(0, 0, s, 2); g.fillRect(0, 0, 2, s);
  }, { repeat });

/** Filet / grillage : mailles transparentes (à utiliser comme alphaMap). */
export const meshAlpha = (repeat: [number, number], diamond = false) =>
  make(`mesh${diamond ? "d" : ""}`, 128, (g, s) => {
    g.fillStyle = "#000"; g.fillRect(0, 0, s, s);
    g.strokeStyle = "#fff"; g.lineWidth = 6;
    if (diamond) {
      g.beginPath(); g.moveTo(0, 0); g.lineTo(s, s); g.moveTo(s, 0); g.lineTo(0, s); g.stroke();
    } else {
      g.strokeRect(0, 0, s, s);
    }
  }, { repeat, srgb: false });

/** Tableau noir : fond vert-noir, traces de craie, équations. */
export const chalkboardTex = () =>
  make("chalkboard", 1024, (g, s, r) => {
    g.fillStyle = "#23382F"; g.fillRect(0, 0, s, s / 2);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`;
      g.beginPath(); g.ellipse(r() * s, r() * s / 2, 40 + r() * 120, 10 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = "rgba(245,245,235,0.92)";
    g.font = "italic 34px Georgia, serif";
    const lines = ["f(x) = x² − 3x + 2", "f'(x) = 2x − 3", "∫₀¹ x² dx = 1/3", "E = mc²", "F = m · a", "Δ = b² − 4ac"];
    lines.forEach((l, i) => g.fillText(l, 40 + (i % 2) * 520, 80 + Math.floor(i / 2) * 110));
    g.strokeStyle = "rgba(245,245,235,0.85)"; g.lineWidth = 3;
    // petite courbe + repère
    g.beginPath(); g.moveTo(560, 470); g.lineTo(960, 470); g.moveTo(600, 490); g.lineTo(600, 330); g.stroke();
    g.beginPath(); for (let x = 0; x <= 340; x += 4) g.lineTo(600 + x, 470 - ((x - 170) ** 2) / 260 - 20); g.stroke();
    g.fillStyle = "#F5B942"; g.fillText("Bac maths-physique", 40, 420);
  }, { repeat: [1, 0.5], offset: [0, 0.5] });

/** Écran de tableur (Pennylane / Cegid) : grille + chiffres. */
export const spreadsheetTex = (accent: string) =>
  make(`sheet${accent}`, 512, (g, s, r) => {
    g.fillStyle = "#F7F8FB"; g.fillRect(0, 0, s, s);
    g.fillStyle = accent; g.fillRect(0, 0, s, 38);
    g.fillStyle = "#FFFFFF"; g.font = "bold 20px Helvetica, Arial"; g.fillText("Grand livre · Clôture 2026", 14, 26);
    g.fillStyle = "#E8EBF2"; g.fillRect(0, 38, 90, s);
    g.strokeStyle = "#D9DDE7"; g.lineWidth = 1;
    for (let y = 38; y < s; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
    for (const x of [90, 250, 380]) { g.beginPath(); g.moveTo(x, 38); g.lineTo(x, s); g.stroke(); }
    g.font = "15px Menlo, monospace"; g.fillStyle = "#3A3F4B";
    for (let y = 56, i = 0; y < s; y += 24, i++) {
      g.fillText(`${401000 + i * 17}`, 10, y + 4);
      g.fillText((r() * 9000 + 100).toFixed(2), 120, y + 4);
      g.fillStyle = r() < 0.2 ? "#C93A18" : "#3A3F4B";
      g.fillText((r() * 9000 + 100).toFixed(2), 270, y + 4);
      g.fillStyle = "#3A3F4B";
    }
  }, { repeat: [1, 1] });

/** Éditeur de code (Indysigner). */
export const codeTex = (accent: string) =>
  make(`code${accent}`, 512, (g, s, r) => {
    g.fillStyle = "#14161C"; g.fillRect(0, 0, s, s);
    g.fillStyle = "#1D2029"; g.fillRect(0, 0, 60, s);
    const cols = [accent, "#7FD1B9", "#C9A5F2", "#F2D57E", "#8AB4F8", "#E6E6E6"];
    g.font = "15px Menlo, monospace";
    for (let y = 24, i = 1; y < s; y += 20, i++) {
      g.fillStyle = "#4B5263"; g.fillText(String(i), 14, y);
      let x = 72 + Math.floor(r() * 4) * 16;
      const n = 2 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const w = 24 + r() * 90;
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x, y - 11, w, 10);
        x += w + 10;
        if (x > s - 40) break;
      }
    }
  }, { repeat: [1, 1] });

/** Tableau de bord data (Albert School) : courbes + barres + KPI. */
export const dashboardTex = (accent: string) =>
  make(`dash${accent}`, 1024, (g, s, r) => {
    g.fillStyle = "#0F1426"; g.fillRect(0, 0, s, s / 2);
    g.fillStyle = "#E9EDFF"; g.font = "bold 30px Helvetica, Arial"; g.fillText("Business & Data · Dashboard", 30, 50);
    // KPI
    ["CA +18 %", "Churn 2,4 %", "NPS 61"].forEach((k, i) => {
      g.fillStyle = "#1A2140"; g.fillRect(30 + i * 320, 80, 290, 90);
      g.fillStyle = accent; g.font = "bold 34px Helvetica, Arial"; g.fillText(k, 50 + i * 320, 138);
    });
    // courbe
    g.strokeStyle = accent; g.lineWidth = 5; g.beginPath();
    for (let x = 0; x <= 540; x += 18) g.lineTo(40 + x, 460 - (x * 0.35 + Math.sin(x / 40) * 30 + r() * 12));
    g.stroke();
    g.strokeStyle = "rgba(233,237,255,0.25)"; g.lineWidth = 1;
    for (let y = 220; y <= 470; y += 50) { g.beginPath(); g.moveTo(40, y); g.lineTo(580, y); g.stroke(); }
    // barres
    for (let i = 0; i < 7; i++) {
      const h = 60 + r() * 190;
      g.fillStyle = i === 5 ? accent : "#3A4B8F";
      g.fillRect(640 + i * 50, 470 - h, 32, h);
    }
  }, { repeat: [1, 0.5], offset: [0, 0.5] });

/** Affiche générique : aplat de couleur + formes + titre. */
export const posterTex = (bg: string, fg: string, title: string, sub = "") =>
  make(`poster${bg}${fg}${title}`, 512, (g, s, r) => {
    g.fillStyle = bg; g.fillRect(0, 0, s, s);
    g.fillStyle = fg;
    g.globalAlpha = 0.9;
    g.beginPath(); g.arc(s * 0.62, s * 0.38, s * 0.22, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 0.5;
    g.fillRect(s * 0.1, s * 0.55, s * 0.5 * (0.6 + r() * 0.4), s * 0.06);
    g.globalAlpha = 1;
    g.font = "bold 58px Helvetica, Arial"; g.fillText(title, s * 0.08, s * 0.82);
    if (sub) { g.font = "26px Helvetica, Arial"; g.fillText(sub, s * 0.08, s * 0.9); }
  }, { repeat: [1, 1] });

/** Ombre de contact douce (dégradé radial) : à poser sous les meubles. */
export const blobTex = () =>
  make("blob", 128, (g, s) => {
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grd.addColorStop(0, "rgba(0,0,0,0.55)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  }, { srgb: false });

/** Occlusion d'angle (dégradé linéaire) : bande sombre au pied des murs. */
export const edgeTex = () =>
  make("edge", 64, (g, s) => {
    const grd = g.createLinearGradient(0, 0, 0, s);
    grd.addColorStop(0, "rgba(0,0,0,0.42)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  }, { srgb: false });

/** Rayon de lumière (fenêtre) : dégradé vertical transparent. */
export const beamTex = () =>
  make("beam", 64, (g, s) => {
    const grd = g.createLinearGradient(0, 0, 0, s);
    grd.addColorStop(0, "rgba(255,255,255,0.55)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
  }, { srgb: false });
