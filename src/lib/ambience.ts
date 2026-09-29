import { scroll } from "./scroll-progress";
import { chapters } from "./story";

/**
 * Son d'ambiance, entièrement synthétisé (Web Audio) : aucun fichier à télécharger.
 * Coupé par défaut ; activé par un clic (exigence des navigateurs).
 *
 * - Dehors : vent, oiseaux le jour, grillons au coucher de soleil.
 * - Un fond par lieu, qui monte quand on s'approche : échanges de balles (calés sur le coup droit de
 *   l'adversaire), terrain de foot (frappes, sifflet), classe (horloge, craie, murmures), cabinet
 *   (clavier, imprimante, ventilation), chambre (musique lo-fi, clavier), Albert (conversations, portables).
 * - Les pas du personnage, calés sur l'animation de marche, selon le sol (dalles, parquet, moquette).
 * - Un carillon au passage des portiques, un « pop » à l'ouverture d'une fiche, une nappe sur l'accueil et la fin.
 */

const CLOSED = ["lycee", "concertae", "indysigner", "albert"];
/** Contacts des pieds dans le clip de marche (phase 0..1), mesurés sur l'animation. */
const STEP_PHASES = [0.16, 0.66];
/** Coup droit de l'adversaire : rebond puis frappe (phase 0..1 du clip de 6,97 s). */
const BOUNCE_PHASE = 0.118, HIT_PHASE = 0.175;
/** Note du carillon par pièce (ré, mi, sol, la). */
const CHIME: Record<string, number> = { lycee: 587.33, concertae: 659.25, indysigner: 783.99, albert: 880 };

export type SceneState = {
  dist: number; walking: boolean; speed: number; walkPhase: number; oppPhase: number;
  inside: number; portal: number; portalRoom: string; cover: number; sunset: boolean;
};

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const between = (a: number, b: number) => a + rnd() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
const smooth = (x: number, a: number, b: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

function noiseBuffer(c: BaseAudioContext, seconds: number, pink = false) {
  const n = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (!pink) { d[i] = w; continue; }
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return b;
}

function impulse(c: BaseAudioContext, seconds: number, decay: number) {
  const n = Math.floor(c.sampleRate * seconds);
  const b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = b.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return b;
}

type Voice = { osc: OscillatorNode; f1: BiquadFilterNode; f2: BiquadFilterNode; g: GainNode; base: number; next: number; left: number };
const VOWELS: [number, number][] = [[730, 1090], [530, 1840], [300, 2200], [570, 840], [330, 900], [500, 1500], [660, 1700]];

/** Le mélangeur : graphe audio + générateurs, sur n'importe quel contexte (temps réel ou hors ligne). */
export class Mixer {
  readonly c: BaseAudioContext;
  readonly out: GainNode;
  private white: AudioBuffer;
  private pink: AudioBuffer;
  private verb: GainNode;
  private stepVerb: GainNode;
  private bus: Record<string, GainNode> = {};
  private next: Record<string, number> = {};
  private voices: Record<string, Voice[]> = {};
  private last = { walk: 0, opp: 0, portalArmed: true, level: new Map<string, number>() };
  private beat = { step: 0, time: 0 };

  constructor(c: BaseAudioContext) {
    this.c = c;
    this.white = noiseBuffer(c, 2);
    this.pink = noiseBuffer(c, 4, true);
    const comp = c.createDynamicsCompressor();
    // Limiteur de sécurité (seuil haut : le compresseur du navigateur ajoute sinon un gain de rattrapage de ~8 dB)
    comp.threshold.value = -3; comp.knee.value = 0; comp.ratio.value = 20; comp.attack.value = 0.003; comp.release.value = 0.15;
    this.out = c.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(comp).connect(c.destination);
    // Réverbération partagée (pièces fermées, carillon)
    const conv = c.createConvolver();
    conv.buffer = impulse(c, 1.8, 2.6);
    this.verb = c.createGain();
    this.verb.gain.value = 0.5;
    this.verb.connect(conv).connect(this.out);
    for (const k of ["outside", "tennis", "foot", "lycee", "concertae", "indysigner", "albert", "steps", "ui", "pad"]) {
      const g = c.createGain(); g.gain.value = 0; g.connect(this.out); this.bus[k] = g;
      if (CLOSED.includes(k)) { const s = c.createGain(); s.gain.value = 0.35; g.connect(s).connect(this.verb); }
    }
    this.bus.ui.gain.value = 1;
    this.bus.steps.gain.value = 1;
    // Les pas résonnent un peu dans les pièces fermées (envoi unique vers la réverbération, réglé à chaque pas)
    this.stepVerb = c.createGain(); this.stepVerb.gain.value = 0;
    this.bus.steps.connect(this.stepVerb).connect(this.verb);
    this.beds();
  }

  /* ───────────── briques ───────────── */

  private env(p: AudioParam, t: number, a: number, peak: number, d: number) {
    // Muet dès la création : sinon le gain vaut 1 jusqu'au premier événement, et une source qui démarre
    // entre deux échantillons laisse passer un échantillon à plein volume (clic).
    p.value = 0;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(peak, t + a);
    p.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private pan(node: AudioNode, value: number) {
    if (!value) return node;
    const p = this.c.createStereoPanner(); p.pan.value = value; node.connect(p); return p;
  }

  private tone(dest: AudioNode, t: number, o: { type?: OscillatorType; f0: number; f1?: number; dur: number; a?: number; peak: number; pan?: number; vib?: [number, number] }) {
    const osc = this.c.createOscillator(); osc.type = o.type ?? "sine";
    osc.frequency.setValueAtTime(o.f0, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const g = this.c.createGain(); this.env(g.gain, t, o.a ?? 0.004, o.peak, o.dur);
    osc.connect(g); this.pan(g, o.pan ?? 0).connect(dest);
    if (o.vib) { const l = this.c.createOscillator(); l.frequency.value = o.vib[0]; const lg = this.c.createGain(); lg.gain.value = o.vib[1]; l.connect(lg).connect(osc.frequency); l.start(t); l.stop(t + o.dur + 0.1); }
    osc.start(t); osc.stop(t + (o.a ?? 0.004) + o.dur + 0.05);
  }

  private burst(dest: AudioNode, t: number, o: { type: BiquadFilterType; f: number; f1?: number; q?: number; dur: number; a?: number; peak: number; pan?: number }) {
    const s = this.c.createBufferSource(); s.buffer = this.white;
    const f = this.c.createBiquadFilter(); f.type = o.type; f.Q.value = o.q ?? 1;
    f.frequency.setValueAtTime(o.f, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);
    const g = this.c.createGain(); this.env(g.gain, t, o.a ?? 0.002, o.peak, o.dur);
    s.connect(f).connect(g); this.pan(g, o.pan ?? 0).connect(dest);
    s.start(t, rnd() * 1.5, o.dur + 0.1);
  }

  private loop(buf: AudioBuffer, dest: AudioNode, filter: { type: BiquadFilterType; f: number; q?: number }, level: number, lfo?: { rate: number; depth: number; target: "f" | "g" }[]) {
    const s = this.c.createBufferSource(); s.buffer = buf; s.loop = true;
    const f = this.c.createBiquadFilter(); f.type = filter.type; f.frequency.value = filter.f; f.Q.value = filter.q ?? 0.7;
    const g = this.c.createGain(); g.gain.value = level;
    s.connect(f).connect(g).connect(dest);
    for (const l of lfo ?? []) {
      const o = this.c.createOscillator(); o.frequency.value = l.rate;
      const lg = this.c.createGain(); lg.gain.value = l.depth;
      o.connect(lg).connect(l.target === "f" ? f.frequency : g.gain); o.start();
    }
    s.start(0, rnd() * buf.duration);
  }

  /** Fonds continus (le gain de chaque bus décide s'ils s'entendent). */
  private beds() {
    const b = this.bus;
    // Vent : bruit rose filtré, qui respire
    this.loop(this.pink, b.outside, { type: "lowpass", f: 620 }, 0.15, [{ rate: 0.05, depth: 320, target: "f" }, { rate: 0.09, depth: 0.055, target: "g" }]);
    this.loop(this.white, b.outside, { type: "bandpass", f: 5200, q: 0.6 }, 0.006, [{ rate: 0.13, depth: 0.004, target: "g" }]);
    // Foot : un peu plus de vent dans les arbres
    this.loop(this.pink, b.foot, { type: "bandpass", f: 900, q: 0.5 }, 0.08, [{ rate: 0.07, depth: 0.05, target: "g" }]);
    // Pièces : bruit de fond (ventilation, salle)
    for (const k of CLOSED) this.loop(this.pink, b[k], { type: "lowpass", f: k === "concertae" ? 260 : 340 }, 0.1);
    const hum = this.c.createOscillator(); hum.frequency.value = 100; const hg = this.c.createGain(); hg.gain.value = 0.004; hum.connect(hg).connect(b.concertae); hum.start();
    // Chambre : craquements de vinyle en fond
    this.loop(this.pink, b.indysigner, { type: "highpass", f: 2500 }, 0.012);
    // Nappe douce (accueil, fin) : accord suspendu, filtré, qui ondule
    const pf = this.c.createBiquadFilter(); pf.type = "lowpass"; pf.frequency.value = 900; pf.Q.value = 0.5;
    const pg = this.c.createGain(); pg.gain.value = 0.05; pf.connect(pg).connect(b.pad);
    const lfo = this.c.createOscillator(); lfo.frequency.value = 0.07; const lg = this.c.createGain(); lg.gain.value = 300; lfo.connect(lg).connect(pf.frequency); lfo.start();
    [48, 55, 59, 62, 67].forEach((m, i) => {
      for (const det of [-6, 6]) {
        const o = this.c.createOscillator(); o.type = i === 0 ? "sine" : "triangle"; o.frequency.value = mtof(m); o.detune.value = det;
        const g = this.c.createGain(); g.gain.value = i === 0 ? 0.35 : 0.16; o.connect(g).connect(pf); o.start();
      }
    });
    const ps = this.c.createGain(); ps.gain.value = 0.4; pg.connect(ps).connect(this.verb);
    // Voix (murmures) : classe, cabinet, Albert
    this.voices.lycee = [this.voice(b.lycee, -0.5, 125), this.voice(b.lycee, 0.3, 210), this.voice(b.lycee, 0.6, 140)];
    this.voices.concertae = [this.voice(b.concertae, -0.4, 118), this.voice(b.concertae, 0.5, 205)];
    this.voices.albert = [this.voice(b.albert, -0.6, 130), this.voice(b.albert, -0.1, 220), this.voice(b.albert, 0.4, 112), this.voice(b.albert, 0.7, 195)];
  }

  /** Une voix lointaine : dent de scie → deux formants → enveloppe par syllabe (on n'entend pas de mots, juste une conversation). */
  private voice(dest: AudioNode, pan: number, base: number): Voice {
    const osc = this.c.createOscillator(); osc.type = "sawtooth"; osc.frequency.value = base;
    const f1 = this.c.createBiquadFilter(); f1.type = "bandpass"; f1.Q.value = 5;
    const f2 = this.c.createBiquadFilter(); f2.type = "bandpass"; f2.Q.value = 7;
    const lp = this.c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1700;
    const g = this.c.createGain(); g.gain.value = 0;
    osc.connect(f1).connect(lp); osc.connect(f2).connect(lp);
    lp.connect(g); this.pan(g, pan).connect(dest);
    osc.start();
    return { osc, f1, f2, g, base, next: 0, left: 0 };
  }

  /* ───────────── sons ponctuels ───────────── */

  private pock(t: number, level: number, pan: number, far = false) {
    const d = this.bus.tennis;
    const lp = this.c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = far ? 1400 : 5000; lp.connect(d);
    this.tone(lp, t, { f0: 270, f1: 185, dur: 0.06, peak: 0.5 * level, pan });
    this.tone(lp, t, { type: "triangle", f0: 560, f1: 410, dur: 0.03, peak: 0.16 * level, pan });
    this.burst(lp, t, { type: "bandpass", f: 1700, q: 1.2, dur: 0.018, peak: 0.55 * level, pan });
    this.tone(lp, t + 0.002, { f0: 1180, dur: 0.05, peak: 0.05 * level, pan });
    // écho sur le grillage
    this.tone(lp, t + 0.085, { f0: 250, f1: 190, dur: 0.05, peak: 0.07 * level, pan: -pan });
  }

  private bounce(t: number, level: number, pan: number) {
    this.tone(this.bus.tennis, t, { f0: 175, f1: 95, dur: 0.05, peak: 0.3 * level, pan });
    this.burst(this.bus.tennis, t, { type: "lowpass", f: 700, dur: 0.03, peak: 0.25 * level, pan });
  }

  private step(t: number, surface: "stone" | "wood" | "carpet", level: number, alt: number) {
    const d = this.bus.steps, k = alt ? 1.04 : 0.97;
    this.stepVerb.gain.setTargetAtTime(surface === "stone" ? 0 : surface === "wood" ? 0.3 : 0.15, t, 0.05);
    if (surface === "stone") {
      this.burst(d, t, { type: "bandpass", f: 1900 * k, q: 0.9, dur: 0.03, peak: 0.06 * level });
      this.tone(d, t, { f0: 135 * k, f1: 80, dur: 0.05, peak: 0.05 * level });
      this.burst(d, t + 0.01, { type: "highpass", f: 4200, dur: 0.02, peak: 0.012 * level });
    } else if (surface === "wood") {
      this.tone(d, t, { f0: 215 * k, f1: 140, dur: 0.06, peak: 0.07 * level });
      this.burst(d, t, { type: "bandpass", f: 950 * k, q: 1.6, dur: 0.035, peak: 0.05 * level });
    } else {
      this.tone(d, t, { f0: 115 * k, f1: 70, dur: 0.05, peak: 0.05 * level });
      this.burst(d, t, { type: "lowpass", f: 520, dur: 0.04, peak: 0.05 * level });
    }
  }

  private key(dest: AudioNode, t: number, pan: number, soft = false) {
    const f = between(2300, 4300), big = rnd() < 0.08;
    this.burst(dest, t, { type: "bandpass", f: big ? 1500 : f, q: 1.4, dur: big ? 0.02 : 0.012, peak: (soft ? 0.03 : 0.05) * between(0.7, 1), pan });
    this.tone(dest, t + 0.004, { f0: soft ? 240 : 190, f1: 120, dur: 0.02, peak: soft ? 0.012 : 0.02, pan });
  }

  private chord(t: number, notes: number[], bass: number) {
    const d = this.bus.indysigner;
    const lp = this.c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2400; lp.connect(d);
    notes.forEach((m, i) => {
      const tt = t + i * 0.012, f = mtof(m);
      // Piano électrique (FM simple) : porteuse + modulateur dont l'indice retombe vite
      const car = this.c.createOscillator(); car.frequency.value = f; car.detune.value = between(-6, 6);
      const mod = this.c.createOscillator(); mod.frequency.value = f;
      const mg = this.c.createGain(); mg.gain.value = 0; mg.gain.setValueAtTime(f * 1.2, tt); mg.gain.exponentialRampToValueAtTime(f * 0.08, tt + 0.5);
      mod.connect(mg).connect(car.frequency);
      const g = this.c.createGain(); this.env(g.gain, tt, 0.008, 0.035, 2.4);
      car.connect(g).connect(lp);
      car.start(tt); mod.start(tt); car.stop(tt + 2.6); mod.stop(tt + 2.6);
    });
    this.tone(d, t, { f0: mtof(bass), dur: 1.1, a: 0.01, peak: 0.12 });
  }

  private drum(t: number, kind: "kick" | "snare" | "hat", v = 1) {
    const d = this.bus.indysigner;
    if (kind === "kick") this.tone(d, t, { f0: 120, f1: 45, dur: 0.22, peak: 0.22 * v });
    else if (kind === "snare") { this.burst(d, t, { type: "bandpass", f: 1900, q: 0.8, dur: 0.12, peak: 0.09 * v }); this.tone(d, t, { f0: 190, f1: 150, dur: 0.07, peak: 0.06 * v }); }
    else this.burst(d, t, { type: "highpass", f: 7000, dur: 0.035, peak: 0.03 * v });
  }

  private whistle(t: number) {
    const d = this.bus.foot;
    const blast = (tt: number, dur: number) => {
      const o = this.c.createOscillator(); o.frequency.value = 2850;
      const am = this.c.createOscillator(); am.frequency.value = 32; const ag = this.c.createGain(); ag.gain.value = 0.4;
      const g = this.c.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0.0001, tt); g.gain.linearRampToValueAtTime(0.05, tt + 0.02); g.gain.setValueAtTime(0.05, tt + dur); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur + 0.06);
      am.connect(ag).connect(g.gain);
      o.connect(g).connect(d); o.start(tt); am.start(tt); o.stop(tt + dur + 0.1); am.stop(tt + dur + 0.1);
    };
    blast(t, 0.18); blast(t + 0.3, 0.42);
  }

  private chime(t: number, room: string) {
    const f = CHIME[room] ?? 700;
    const one = (tt: number, ff: number, peak: number) => {
      [[1, 2.4, 1], [2.76, 1.1, 0.35], [5.4, 0.5, 0.15]].forEach(([r, dur, a]) => this.tone(this.bus.ui, tt, { f0: ff * r, dur, a: 0.003, peak: peak * a }));
    };
    one(t, f, 0.035); one(t + 0.12, f * 1.5, 0.025);
    // queue réverbérée
    this.tone(this.verb, t, { f0: f, dur: 2.5, a: 0.003, peak: 0.03 });
  }

  ui(kind: "open" | "close" | "on") {
    const t = this.c.currentTime + 0.01;
    if (kind === "open") { this.tone(this.bus.ui, t, { f0: 660, f1: 990, dur: 0.08, peak: 0.05 }); this.tone(this.bus.ui, t + 0.05, { f0: 1320, dur: 0.12, peak: 0.02 }); }
    else if (kind === "close") this.tone(this.bus.ui, t, { f0: 990, f1: 660, dur: 0.08, peak: 0.035 });
    else { this.tone(this.bus.ui, t, { f0: 523.25, dur: 0.5, peak: 0.04 }); this.tone(this.bus.ui, t + 0.09, { f0: 783.99, dur: 0.7, peak: 0.03 }); }
  }

  /* ───────────── ordonnanceur ───────────── */

  private level(k: string, v: number, now: number) {
    const prev = this.last.level.get(k) ?? -1;
    if (Math.abs(prev - v) < 0.004) return;
    this.last.level.set(k, v);
    this.bus[k].gain.setTargetAtTime(v, now, 0.25);
  }

  private due(k: string, now: number, horizon: number, gap: () => number, fire: (t: number) => void) {
    if (this.next[k] === undefined || this.next[k] < now - 1) this.next[k] = now + gap() * rnd();
    while (this.next[k] < horizon) { fire(Math.max(this.next[k], now)); this.next[k] += gap(); }
  }

  /** À appeler ~60 fois par seconde : ajuste les volumes et programme les sons des 150 ms à venir. */
  tick(now: number, s: SceneState) {
    const horizon = now + 0.15;
    const scene = 1 - 0.8 * s.cover;
    // Proximité de chaque lieu (1 dedans, décroît en s'éloignant ; plus vite pour les pièces fermées)
    const near: Record<string, number> = {};
    for (const c of chapters) {
      const mid = c.at + c.length / 2, out = Math.abs(s.dist - mid) - (c.length / 2 + 0.6);
      near[c.id] = 1 - smooth(out, 0, CLOSED.includes(c.id) ? 3.5 : 9);
      this.level(c.id, near[c.id] * scene * (CLOSED.includes(c.id) ? 1.25 : 0.9), now);
    }
    this.level("outside", (1 - 0.75 * s.inside) * scene, now);
    this.level("pad", s.cover, now);
    const on = (k: string) => near[k] * scene > 0.02;

    // Oiseaux (jour) ou grillons (coucher de soleil)
    if (!s.sunset) this.due("bird", now, horizon, () => between(1.2, 5), (t) => {
      const n = 2 + Math.floor(rnd() * 4), f = between(2600, 4600), up = rnd() < 0.5, pan = between(-0.8, 0.8), sp = between(0.09, 0.16);
      for (let i = 0; i < n; i++) this.tone(this.bus.outside, t + i * sp, { f0: f * (1 + i * 0.04), f1: f * (up ? 1.25 : 0.8), dur: between(0.05, 0.11), a: 0.006, peak: between(0.02, 0.045), pan, vib: [between(25, 45), between(40, 120)] });
    });
    else this.due("cricket", now, horizon, () => between(0.5, 0.9), (t) => {
      const pan = pick([-0.7, 0.6]), f = pan < 0 ? 4550 : 4720;
      for (let i = 0; i < 3; i++) this.tone(this.bus.outside, t + i * 0.035, { f0: f, dur: 0.018, a: 0.002, peak: 0.018, pan });
    });

    // Tennis : rebond puis frappe, calés sur le coup droit de l'adversaire ; échanges lointains sur les autres courts
    if (on("tennis")) {
      const p = s.oppPhase, q = this.last.opp;
      const crossed = (x: number) => (q < x && p >= x) || (q > p && (x > q || x <= p) && q - p > 0.5);
      if (crossed(BOUNCE_PHASE)) this.bounce(now + 0.02, 0.55, -0.25);
      if (crossed(HIT_PHASE)) this.pock(now + 0.02, 0.65, -0.25);
      this.due("farcourt", now, horizon, () => between(1.0, 1.6), (t) => { if (rnd() < 0.85) this.pock(t, 0.22, between(0.3, 0.9), true); });
    }
    this.last.opp = s.oppPhase;

    // Foot : frappes lointaines, sifflet de temps en temps
    if (on("foot")) {
      this.due("kick", now, horizon, () => between(1.8, 5.5), (t) => {
        const pan = between(-0.6, 0.6);
        this.tone(this.bus.foot, t, { f0: 95, f1: 50, dur: 0.14, peak: 0.12, pan });
        this.burst(this.bus.foot, t, { type: "lowpass", f: 950, dur: 0.05, peak: 0.08, pan });
      });
      this.due("whistle", now, horizon, () => between(12, 22), (t) => this.whistle(t));
    }

    // Classe : horloge, craie, murmures
    if (on("lycee")) {
      this.due("clock", now, horizon, () => 1, (t) => {
        const tock = Math.round(t) % 2 === 0;
        this.burst(this.bus.lycee, t, { type: "highpass", f: 3200, dur: 0.005, peak: 0.03, pan: -0.3 });
        this.tone(this.bus.lycee, t, { f0: tock ? 2000 : 2400, dur: 0.012, peak: 0.01, pan: -0.3 });
      });
      this.due("chalk", now, horizon, () => between(5, 11), (t) => {
        let tt = t;
        for (let i = 0, n = 4 + Math.floor(rnd() * 8); i < n; i++) {
          this.tone(this.bus.lycee, tt, { f0: 1250, dur: 0.012, peak: 0.02, pan: 0.2 });
          const dur = between(0.05, 0.22), f = between(2800, 4200);
          this.burst(this.bus.lycee, tt + 0.01, { type: "bandpass", f, f1: f * between(0.85, 1.15), q: 4, dur, a: 0.012, peak: 0.035, pan: 0.2 });
          tt += dur + between(0.05, 0.18);
        }
      });
    }

    // Cabinet : deux personnes au clavier, imprimante
    if (on("concertae")) {
      for (const [who, pan] of [["typeA", -0.5], ["typeB", 0.45]] as const) {
        this.due(who, now, horizon, () => (rnd() < 0.12 ? between(0.8, 3) : between(0.07, 0.17)), (t) => this.key(this.bus.concertae, t, pan));
      }
      this.due("printer", now, horizon, () => between(24, 40), (t) => {
        const d = this.bus.concertae;
        const o = this.c.createOscillator(); o.type = "sawtooth"; o.frequency.value = 58;
        const lp = this.c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480;
        const g = this.c.createGain(); g.gain.value = 0; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.12); g.gain.setValueAtTime(0.05, t + 2.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
        const am = this.c.createOscillator(); am.frequency.value = 9; const ag = this.c.createGain(); ag.gain.value = 0.02; am.connect(ag).connect(g.gain);
        o.connect(lp).connect(g); this.pan(g, 0.6).connect(d);
        o.start(t); am.start(t); o.stop(t + 2.7); am.stop(t + 2.7);
        this.burst(d, t + 0.6, { type: "bandpass", f: 1800, f1: 3800, q: 0.8, dur: 1.4, a: 0.2, peak: 0.02, pan: 0.6 });
      });
    }

    // Chambre : musique lo-fi (74 BPM) + clavier mécanique
    if (on("indysigner")) {
      const sixteenth = 60 / 74 / 4;
      if (this.beat.time < now - 0.5) { this.beat.time = now + 0.05; this.beat.step = 0; }
      const prog: [number[], number][] = [[[53, 57, 60, 64], 38], [[53, 59, 64, 69], 43], [[52, 55, 59, 62], 36], [[55, 60, 64, 71], 45]];
      while (this.beat.time < horizon) {
        const st = this.beat.step % 16, bar = Math.floor(this.beat.step / 16) % 4, t = this.beat.time + (st % 2 ? sixteenth * 0.12 : 0);
        if (st === 0) this.chord(t, prog[bar][0], prog[bar][1]);
        if (st === 10 && rnd() < 0.6) this.chord(t, prog[bar][0].slice(1), prog[bar][1] + 12);
        if (st === 0 || st === 7 || st === 10) this.drum(t, "kick", st === 0 ? 1 : 0.7);
        if (st === 4 || st === 12) this.drum(t, "snare");
        if (st % 2 === 0) this.drum(t, "hat", st % 4 === 0 ? 1 : 0.6);
        this.beat.step++; this.beat.time += sixteenth;
      }
      this.due("typeC", now, horizon, () => (rnd() < 0.1 ? between(1.5, 4) : between(0.06, 0.14)), (t) => this.key(this.bus.indysigner, t, 0.35));
      this.due("crackle", now, horizon, () => between(0.03, 0.25), (t) => this.burst(this.bus.indysigner, t, { type: "highpass", f: 3000, dur: 0.003, peak: between(0.01, 0.04), pan: between(-0.5, 0.5) }));
    }

    // Albert : portables, conversations
    if (on("albert")) {
      this.due("typeD", now, horizon, () => (rnd() < 0.15 ? between(0.6, 2.5) : between(0.08, 0.2)), (t) => this.key(this.bus.albert, t, -0.4, true));
      this.due("typeE", now, horizon, () => (rnd() < 0.15 ? between(0.6, 2.5) : between(0.08, 0.2)), (t) => this.key(this.bus.albert, t, 0.5, true));
    }

    // Murmures : chaque voix enchaîne des syllabes (voyelle + hauteur au hasard), par phrases
    for (const [room, vs] of Object.entries(this.voices)) {
      if (!on(room)) continue;
      for (const v of vs) {
        if (v.next < now - 1) v.next = now + rnd() * 2;
        while (v.next < horizon) {
          const t = Math.max(v.next, now);
          if (v.left <= 0) { v.left = 3 + Math.floor(rnd() * 10); v.next = t + between(0.6, 2.8); continue; }
          const dur = between(0.09, 0.22), [a, b] = pick(VOWELS), k = v.base > 170 ? 1.15 : 1;
          v.f1.frequency.setTargetAtTime(a * k, t, 0.02); v.f2.frequency.setTargetAtTime(b * k, t, 0.02);
          v.osc.frequency.setTargetAtTime(v.base * between(0.9, 1.18), t, 0.04);
          v.g.gain.setTargetAtTime(between(0.05, 0.09), t, 0.02);
          v.g.gain.setTargetAtTime(0.0001, t + dur, 0.03);
          v.next = t + dur + between(0.03, 0.09);
          v.left--;
        }
      }
    }

    // Pas du personnage, calés sur l'animation de marche
    if (s.walking) {
      const p = s.walkPhase, q = this.last.walk;
      let dp = p - q; if (dp > 0.5) dp -= 1; if (dp < -0.5) dp += 1;
      STEP_PHASES.forEach((x, i) => {
        let a = q, b = q + dp; if (b < a) [a, b] = [b, a];
        if ((x > a && x <= b) || (x + 1 > a && x + 1 <= b) || (x - 1 > a && x - 1 <= b)) {
          const room = chapters.find((c) => CLOSED.includes(c.id) && s.dist > c.at - 0.45 && s.dist < c.at + c.length + 0.45)?.id;
          const surface = room === "concertae" || room === "indysigner" ? "wood" : room ? "carpet" : "stone";
          this.step(now + 0.01, surface, (0.75 + 0.25 * Math.min(1, Math.abs(s.speed) / 2)) * scene, i);
        }
      });
    }
    this.last.walk = s.walkPhase;

    // Carillon au franchissement d'un portique
    if (this.last.portalArmed && s.portal > 0.85) { this.chime(now + 0.01, s.portalRoom); this.last.portalArmed = false; }
    if (s.portal < 0.3) this.last.portalArmed = true;
  }
}

/** Pilote temps réel : crée le contexte au premier clic, lit l'état de l'histoire à chaque image. */
class Ambience {
  enabled = false;
  private ctx: AudioContext | null = null;
  private mixer: Mixer | null = null;
  private raf = 0;
  private listeners = new Set<() => void>();

  subscribe = (l: () => void) => { this.listeners.add(l); return () => { this.listeners.delete(l); }; };
  getSnapshot = () => this.enabled;
  getServerSnapshot = () => false;

  toggle() { if (this.enabled) this.disable(); else this.enable(); }

  enable() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.mixer = new Mixer(this.ctx);
      this.mixer.out.gain.value = 0;
      document.addEventListener("visibilitychange", () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend(); else if (this.enabled) this.ctx.resume();
      });
    }
    this.ctx.resume();
    this.enabled = true;
    this.mixer!.out.gain.setTargetAtTime(0.9, this.ctx.currentTime, 0.3);
    this.mixer!.ui("on");
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.frame);
    this.emit();
  }

  disable() {
    if (!this.ctx || !this.mixer) return;
    this.enabled = false;
    this.mixer.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    cancelAnimationFrame(this.raf);
    const c = this.ctx;
    setTimeout(() => { if (!this.enabled) c.suspend(); }, 700);
    this.emit();
  }

  ui(kind: "open" | "close") { if (this.enabled && this.mixer) this.mixer.ui(kind); }

  private emit() { this.listeners.forEach((l) => l()); }

  private frame = () => {
    if (!this.enabled || !this.ctx || !this.mixer) return;
    this.mixer.tick(this.ctx.currentTime, {
      dist: scroll.dist, walking: scroll.walking, speed: scroll.speed, walkPhase: scroll.walkPhase,
      oppPhase: scroll.clocks.opponent ?? 0, inside: scroll.inside, portal: scroll.portal, portalRoom: scroll.portalRoom,
      cover: Math.max(scroll.intro, scroll.end), sunset: document.documentElement.dataset.theme !== "light",
    });
    this.raf = requestAnimationFrame(this.frame);
  };
}

export const ambience = new Ambience();

/**
 * Rendu hors ligne d'une scène (outil de réglage) : renvoie le niveau RMS et la crête en dBFS,
 * pour vérifier le mixage sans l'écouter.
 */
export async function renderScene(state: Partial<SceneState>, seconds = 8) {
  const c = new OfflineAudioContext(2, Math.floor(44100 * seconds), 44100);
  const m = new Mixer(c);
  const s: SceneState = { dist: 0, walking: false, speed: 0, walkPhase: 0, oppPhase: 0, inside: 0, portal: 0, portalRoom: "", cover: 0, sunset: false, ...state };
  for (let t = 0; t < seconds; t += 1 / 60) {
    const st = { ...s };
    if (s.walking) st.walkPhase = ((t * Math.abs(s.speed || 1.4)) / 1.4 / 1.067) % 1;
    st.oppPhase = (t / 6.97) % 1;
    m.tick(t, st);
  }
  const buf = await c.startRendering();
  let sum = 0, peak = 0, n = 0;
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = Math.floor(44100 * 0.5); i < d.length; i++) { sum += d[i] * d[i]; peak = Math.max(peak, Math.abs(d[i])); n++; }
  }
  const db = (v: number) => Math.round(20 * Math.log10(Math.max(v, 1e-9)) * 10) / 10;
  return { rms: db(Math.sqrt(sum / n)), peak: db(peak), buffer: buf };
}
