"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-progress";
import { chapters, outside, PATH_LENGTH, type Clip } from "@/lib/story";
import { Character } from "./character";
import { Diorama } from "./rooms";
import { Flat, GradientSky } from "./materials";
import { Rock, Tree } from "./props";

/** Le chemin : un ruban en S sur l'île. */
export function buildPath() {
  const pts: THREE.Vector3[] = [];
  for (let d = 0; d <= PATH_LENGTH; d += 4) pts.push(new THREE.Vector3(Math.sin(d * 0.09) * 1.8, 0, -d));
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}

export function World({ sunset, mobile }: { sunset: boolean; mobile: boolean }) {
  const curve = useMemo(buildPath, []);
  const L = useMemo(() => curve.getLength(), [curve]);
  const dist = useRef(0);
  const speed = useRef(0);
  const [state, setState] = useState<{ walking: boolean; action: Clip; chapter: number }>({ walking: false, action: "idle", chapter: -1 });
  const { camera } = useThree();
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), side: new THREE.Vector3(), cam: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion(), m: new THREE.Matrix4() }), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const cur = useMemo(() => ({ fog: new THREE.Color(), skyTop: new THREE.Color(), skyBot: new THREE.Color() }), []);

  useFrame((_, dt) => {
    const target = scroll.progress * L;
    const prev = dist.current;
    dist.current += (target - dist.current) * Math.min(1, dt * 3.5);
    speed.current = (dist.current - prev) / Math.max(dt, 1e-3);
    const walking = Math.abs(speed.current) > 0.12;

    let chapter = -1;
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      if (dist.current >= c.at - 0.5 && dist.current <= c.at + c.length + 0.5) chapter = i;
    }
    scroll.chapter = chapter;
    const action: Clip = chapter >= 0 ? chapters[chapter].clip : "idle";
    if (walking !== state.walking || action !== state.action || chapter !== state.chapter) setState({ walking, action, chapter });

    // Caméra 3/4 : devant-droite du personnage, légèrement en hauteur ; les dioramas sont à sa gauche
    const u = THREE.MathUtils.clamp(dist.current / L, 0, 1);
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    tmp.side.crossVectors(tmp.up, tmp.t).normalize();
    const inRoom = chapter >= 0;
    const back = mobile ? 6.5 : 5.2;
    const lat = mobile ? 2.2 : inRoom ? 4.6 : 4.0;
    const h = mobile ? 3.4 : 2.9;
    tmp.cam.copy(tmp.p).addScaledVector(tmp.t, -back).addScaledVector(tmp.side, lat).setY(h);
    tmp.look.copy(tmp.p).addScaledVector(tmp.t, 1.0).addScaledVector(tmp.side, mobile ? 0 : -1.6).setY(mobile ? 0.2 : 1.0);
    const end = THREE.MathUtils.smoothstep(u, 0.955, 1);
    if (end > 0) {
      const front = new THREE.Vector3().copy(tmp.p).addScaledVector(tmp.t, 3.2).addScaledVector(tmp.side, 1.2).setY(1.5);
      tmp.cam.lerp(front, end);
      tmp.look.lerp(new THREE.Vector3().copy(tmp.p).setY(1.1), end);
    }
    camera.position.lerp(tmp.cam, Math.min(1, dt * 2.2));
    tmp.m.lookAt(camera.position, tmp.look, tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    camera.quaternion.slerp(tmp.q, Math.min(1, dt * 2.6));

    if (sun.current) {
      sun.current.position.copy(tmp.p).add(sunset ? new THREE.Vector3(-10, 6, 8) : new THREE.Vector3(6, 14, 5));
      sun.current.target.position.copy(tmp.p);
      sun.current.target.updateMatrixWorld();
    }
    // Couleurs d'ambiance : fondu vers la palette du chapitre
    const pal = chapter >= 0 ? (sunset ? chapters[chapter].sunset : chapters[chapter].day) : (sunset ? outside.sunset : outside.day);
    cur.fog.lerp(new THREE.Color(pal.fog), Math.min(1, dt * 1.5));
    if (fogRef.current) fogRef.current.color.copy(cur.fog);
  });

  const o = sunset ? outside.sunset : outside.day;

  return (
    <>
      <GradientSky top={o.sky} bottom={o.fog} />
      <fog ref={fogRef} attach="fog" args={[o.fog, 14, 46]} />
      <hemisphereLight args={[sunset ? "#FFC79A" : "#DCEBFF", sunset ? "#6B5A4A" : "#7A8F6A", sunset ? 0.9 : 1.1]} />
      <directionalLight ref={sun} intensity={sunset ? 2.2 : 2.6} color={sunset ? "#FFB27A" : "#FFF6E8"} castShadow={!mobile}
        shadow-mapSize={mobile ? 512 : 1536} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-near={1} shadow-camera-far={45} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      {!mobile && <SoftShadows size={18} samples={10} focus={0.6} />}

      {/* L'île : une dalle qui suit le chemin, bords doux, rien au-delà */}
      <Island curve={curve} ground={o.ground} path={o.path} />
      <Scenery curve={curve} sunset={sunset} />

      {chapters.map((c, i) => (
        <Diorama key={c.id} curve={curve} chapter={c} palette={sunset ? c.sunset : c.day} active={state.chapter === i} sunset={sunset} />
      ))}

      <Character curve={curve} distanceRef={dist} speedRef={speed} action={state.action} walking={state.walking} />
    </>
  );
}

/** Bande de sol suivant la courbe (largeur w), avec le sentier au centre. */
function Ribbon({ curve, w, y, color, uvScale = 1 }: { curve: THREE.Curve<THREE.Vector3>; w: number; y: number; color: string; uvScale?: number }) {
  const geo = useMemo(() => {
    const n = 200;
    const pos: number[] = [], idx: number[] = [], uv: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const s = new THREE.Vector3().crossVectors(up, t).normalize().multiplyScalar(w / 2);
      pos.push(p.x - s.x, y, p.z - s.z, p.x + s.x, y, p.z + s.z);
      uv.push(0, u * uvScale, 1, u * uvScale);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }, [curve, w, y, uvScale]);
  return <mesh geometry={geo} receiveShadow><Flat color={color} /></mesh>;
}

function Island({ curve, ground, path }: { curve: THREE.Curve<THREE.Vector3>; ground: string; path: string }) {
  return (
    <group>
      <Ribbon curve={curve} w={30} y={-0.02} color={ground} />
      <Ribbon curve={curve} w={1.7} y={0.005} color={path} />
      {/* Épaisseur de l'île (bord visible en contrebas) */}
      <Ribbon curve={curve} w={30} y={-1.4} color="#5A6A52" />
    </group>
  );
}

/** Arbres et rochers semés le long du chemin, hors des dioramas, jamais sur le sentier. */
function Scenery({ curve, sunset }: { curve: THREE.Curve<THREE.Vector3>; sunset: boolean }) {
  const items = useMemo(() => {
    const out: { kind: "tree" | "rock"; pos: [number, number, number]; s: number }[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    for (let d = 2; d < PATH_LENGTH - 2; d += 1.6) {
      const inRoom = chapters.some((c) => d > c.at - 2 && d < c.at + c.length + 2);
      const u = d / curve.getLength();
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const side = new THREE.Vector3().crossVectors(up, t).normalize();
      const sgn = inRoom ? 1 : rnd() > 0.35 ? -1 : 1; // dans un diorama, seulement à droite (côté caméra, en arrière-plan bas)
      const off = (inRoom ? 6.5 : 3.2) + rnd() * 6;
      const q = p.clone().addScaledVector(side, sgn * off);
      out.push({ kind: rnd() > 0.3 ? "tree" : "rock", pos: [q.x, 0, q.z], s: 0.7 + rnd() * 0.8 });
    }
    return out;
  }, [curve]);
  return (
    <group>
      {items.map((it, i) => it.kind === "tree"
        ? <Tree key={i} position={it.pos} scale={it.s} color={sunset ? ["#4C8A5A", "#5C9A5A"][i % 2] : ["#5FA86A", "#6DB57A", "#4E9A5F"][i % 3]} />
        : <Rock key={i} position={it.pos} scale={it.s} color={sunset ? "#8A8580" : "#9AA3A8"} />)}
    </group>
  );
}
