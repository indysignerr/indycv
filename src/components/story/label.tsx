"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Inscriptions 3D (enseignes, plaques des portiques…) dessinées une fois sur une petite image.
 * Remplace le texte vectoriel de drei/troika, qui créait un deuxième contexte 3D, un fil de calcul dédié
 * et allait chercher sa police sur un serveur externe à chaque visite (lent, voire bloqué par certains réseaux).
 */

const FAMILY = "IndyLabel";
let fontReady: Promise<void> | null = null;

/** Police des inscriptions (fichier local de 27 Ko, chargé une seule fois). */
export function labelsFont(): Promise<void> {
  if (!fontReady) {
    fontReady =
      typeof FontFace === "undefined"
        ? Promise.resolve()
        : new FontFace(FAMILY, "url(/fonts/bricolage-700.woff) format('woff')", { weight: "700" })
            .load()
            .then((f) => { document.fonts.add(f); })
            .catch(() => {});
  }
  return fontReady;
}

type Props = {
  children: string;
  fontSize: number;
  color: string;
  /** Espacement des lettres, en fraction de la taille de police. */
  letterSpacing?: number;
  /** Largeur maximale (unités 3D) : le texte passe à la ligne au-delà. */
  maxWidth?: number;
  outlineWidth?: number;
  outlineColor?: string;
  side?: THREE.Side;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

type Layout = { lines: { text: string; w: number }[]; width: number };

function measure(ctx: CanvasRenderingContext2D, s: string, spacing: number) {
  let w = 0;
  for (const ch of s) w += ctx.measureText(ch).width + spacing;
  return Math.max(0, w - spacing);
}

function layout(ctx: CanvasRenderingContext2D, text: string, spacing: number, maxPx: number): Layout {
  const lines: Layout["lines"] = [];
  if (!Number.isFinite(maxPx)) lines.push({ text, w: measure(ctx, text, spacing) });
  else {
    let cur = "";
    for (const word of text.split(/\s+/)) {
      const next = cur ? `${cur} ${word}` : word;
      if (cur && measure(ctx, next, spacing) > maxPx) { lines.push({ text: cur, w: measure(ctx, cur, spacing) }); cur = word; }
      else cur = next;
    }
    if (cur) lines.push({ text: cur, w: measure(ctx, cur, spacing) });
  }
  return { lines, width: Math.max(...lines.map((l) => l.w)) };
}

/** Dessine le texte ; renvoie la taille de l'inscription en unités 3D. */
function paint(canvas: HTMLCanvasElement, p: Props): [number, number] {
  const ctx = canvas.getContext("2d");
  if (!ctx) return [0.01, 0.01];
  const px = Math.round(Math.min(160, Math.max(56, p.fontSize * 190)));
  const font = `700 ${px}px ${FAMILY}, "Bricolage Grotesque", system-ui, sans-serif`;
  const spacing = (p.letterSpacing ?? 0) * px;
  const outline = p.outlineWidth ? (p.outlineWidth / p.fontSize) * px : 0;
  ctx.font = font;
  const L = layout(ctx, p.children, spacing, p.maxWidth ? (p.maxWidth / p.fontSize) * px : Infinity);
  const pad = Math.ceil(px * 0.18 + outline);
  const lineH = px * 1.18;
  canvas.width = Math.ceil(L.width + pad * 2);
  canvas.height = Math.ceil(L.lines.length * lineH + pad * 2);
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const pass = (stroke: boolean) => {
    L.lines.forEach((ln, i) => {
      let x = pad + (L.width - ln.w) / 2;
      const y = pad + lineH * (i + 0.5);
      for (const ch of ln.text) {
        if (stroke) ctx.strokeText(ch, x, y);
        else ctx.fillText(ch, x, y);
        x += ctx.measureText(ch).width + spacing;
      }
    });
  };
  if (outline) { ctx.strokeStyle = p.outlineColor ?? "#000"; ctx.lineWidth = outline * 2; pass(true); }
  ctx.fillStyle = p.color;
  pass(false);
  return [(canvas.width / px) * p.fontSize, (canvas.height / px) * p.fontSize];
}

export function Label(props: Props) {
  const { position, rotation, side = THREE.DoubleSide } = props;
  const mesh = useRef<THREE.Mesh>(null);
  const { tex, size } = useMemo(() => {
    const canvas = document.createElement("canvas");
    const size = paint(canvas, props);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { tex, size };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.children, props.fontSize, props.color, props.letterSpacing, props.maxWidth, props.outlineWidth, props.outlineColor]);

  // Si la police n'était pas encore là au premier dessin : on redessine dès qu'elle arrive
  useEffect(() => {
    let alive = true;
    labelsFont().then(() => {
      if (!alive) return;
      const s = paint(tex.image as HTMLCanvasElement, props);
      tex.needsUpdate = true;
      mesh.current?.scale.set(s[0], s[1], 1);
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex]);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <mesh ref={mesh} position={position} rotation={rotation} scale={[size[0], size[1], 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent alphaTest={0.02} side={side} />
    </mesh>
  );
}
