"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-progress";
import { chapters, outside, PATH_LENGTH, type Clip } from "@/lib/story";
import { Character } from "./character";
import { Diorama } from "./rooms";
import { Clouds, Flat, GradientSky } from "./materials";
import { Bench, Bush, LampPost, Rock, Tree } from "./props";

/** Le chemin : un ruban en S sur l'île. */
export function buildPath() {
  const pts: THREE.Vector3[] = [];
  // Ligne droite : les portes des pièces tombent exactement sur le passage du personnage
  for (let d = 0; d <= PATH_LENGTH; d += 4) pts.push(new THREE.Vector3(0, 0, -d));
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
    let camChapter = -1;
    for (let i = 0; i < chapters.length; i++) {
      const cc = chapters[i];
      if (dist.current >= cc.at + 0.6 && dist.current <= cc.at + cc.length - 1.4) camChapter = i;
    }
    const inRoom = camChapter >= 0;
    // Dehors : derrière-droite. Dans une pièce : la caméra pivote sur la droite et regarde la pièce de côté.
    const c = camChapter >= 0 ? chapters[camChapter] : null;
    const roomMid = c ? c.at + c.length / 2 : 0;
    const back = inRoom ? (mobile ? 4.5 : 3.8) : mobile ? 6.0 : 5.0;
    const lat = inRoom ? (mobile ? 9.0 : 7.2) : mobile ? 2.6 : 5.0;
    const h = inRoom ? (mobile ? 3.6 : 2.8) : mobile ? 3.6 : 3.4;
    const anchor = inRoom ? curve.getPointAt(THREE.MathUtils.clamp(roomMid / L, 0, 1)) : tmp.p;
    const anchorT = inRoom ? curve.getTangentAt(THREE.MathUtils.clamp(roomMid / L, 0, 1)) : tmp.t;
    const anchorS = new THREE.Vector3().crossVectors(tmp.up, anchorT).normalize();
    tmp.cam.copy(anchor).addScaledVector(anchorT, inRoom ? (dist.current - roomMid) * 0.35 - back : -back).addScaledVector(anchorS, lat).setY(h);
    if (inRoom) tmp.look.copy(tmp.p).lerp(anchor, 0.6).addScaledVector(anchorT, 1.2).addScaledVector(anchorS, -2.8).setY(mobile ? 0.5 : 1.2);
    else tmp.look.copy(tmp.p).addScaledVector(tmp.t, 1.0).addScaledVector(tmp.side, mobile ? 0 : -1.6).setY(mobile ? 0.2 : 1.0);
    camera.position.lerp(tmp.cam, Math.min(1, dt * 1.5));
    tmp.m.lookAt(camera.position, tmp.look, tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    camera.quaternion.slerp(tmp.q, Math.min(1, dt * 1.8));

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
      <Clouds sunset={sunset} />
      <Horizon sunset={sunset} />
      {/* Éclairage d'ambiance synthétique (studio) : reflets doux sur les matières plates, sans HDRI */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={sunset ? 2.2 : 1.6} color={sunset ? "#FFB27A" : "#FFFFFF"} position={[0, 8, -6]} scale={[14, 6, 1]} />
        <Lightformer intensity={0.7} color={sunset ? "#FFD9B0" : "#DCEBFF"} position={[-8, 3, 4]} scale={[6, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
        <Lightformer intensity={0.4} color={sunset ? "#8A5A4A" : "#BFD7A8"} position={[0, -5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
      </Environment>
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
        <Diorama key={c.id} curve={curve} chapter={c} palette={sunset ? c.sunset : c.day} active={state.chapter === i} sunset={sunset} distanceRef={dist} />
      ))}

      <Character curve={curve} distanceRef={dist} speedRef={speed} action={state.action} walking={state.walking} racket={state.chapter === 0} />
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
      if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } // normales vers le haut
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }, [curve, w, y, uvScale]);
  return <mesh geometry={geo} receiveShadow><meshStandardMaterial color={color} roughness={0.95} metalness={0} side={THREE.DoubleSide} /></mesh>;
}

/** Chemin de dalles : une dalle arrondie tous les 0,95 m, orientée le long de la courbe. */
function Tiles({ curve, color }: { curve: THREE.Curve<THREE.Vector3>; color: string }) {
  const items = useMemo(() => {
    const out: { p: THREE.Vector3; q: THREE.Quaternion }[] = [];
    const L = curve.getLength(); const up = new THREE.Vector3(0, 1, 0);
    const closed = chapters.filter((c) => ["lycee", "concertae", "indysigner", "albert"].includes(c.id));
    for (let d = 0.5; d < L; d += 0.95) {
      if (closed.some((c) => d > c.at - 0.3 && d < c.at + c.length + 0.3)) continue;
      const u = d / L; const p = curve.getPointAt(u); const t = curve.getTangentAt(u);
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(t, new THREE.Vector3(), up));
      out.push({ p, q });
    }
    return out;
  }, [curve]);
  return (
    <group>
      {items.map((it, i) => (
        <mesh key={i} position={[it.p.x, 0.02, it.p.z]} quaternion={it.q} receiveShadow castShadow>
          <boxGeometry args={[1.1, 0.07, 0.72]} />
          <Flat color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Horizon : trois rangées de collines en silhouette (de plus en plus pâles) + soleil bas au coucher. */
function Horizon({ sunset }: { sunset: boolean }) {
  const rows = useMemo(() => [0, 1, 2].map((r) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -140 + i * 7;
      const y = 4 + r * 3 + Math.abs(Math.sin(i * 0.9 + r * 2.1) * 6 + Math.sin(i * 0.31 + r) * 4) * (1 + r * 0.35);
      pts.push([x, y]);
    }
    const shape = new THREE.Shape();
    shape.moveTo(-140, -10);
    pts.forEach(([x, y]) => shape.lineTo(x, y));
    shape.lineTo(140, -10);
    return { geo: new THREE.ShapeGeometry(shape), z: -58 - r * 8, r };
  }), []);
  const cols = sunset ? ["#8A5E58", "#B07A6A", "#D49A80"] : ["#7FA38C", "#9DBBA6", "#BCD3C2"];
  return (
    <group>
      {rows.map(({ geo, z, r }) => (
        <mesh key={r} geometry={geo} position={[0, -6, z]} frustumCulled={false}>
          <meshBasicMaterial color={cols[r]} fog={false} toneMapped={false} />
        </mesh>
      ))}
      {sunset && (
        <mesh position={[18, 9, -75]}><circleGeometry args={[5.5, 40]} /><meshBasicMaterial color="#FFD5A0" fog={false} toneMapped={false} /></mesh>
      )}
    </group>
  );
}

function Island({ curve, ground, path }: { curve: THREE.Curve<THREE.Vector3>; ground: string; path: string }) {
  return (
    <group>
      <Ribbon curve={curve} w={30} y={-0.02} color={ground} />
      <Tiles curve={curve} color={path} />
      {/* Épaisseur de l'île (bord visible en contrebas) */}
      <Ribbon curve={curve} w={30} y={-1.4} color="#5A6A52" />
    </group>
  );
}

/** Arbres et rochers semés le long du chemin, hors des dioramas, jamais sur le sentier. */
function Scenery({ curve, sunset }: { curve: THREE.Curve<THREE.Vector3>; sunset: boolean }) {
  const items = useMemo(() => {
    const out: { kind: "tree" | "rock" | "bush" | "lamp" | "bench"; pos: [number, number, number]; s: number; rot: number }[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    let seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    const near = (d: number) => chapters.some((c) => d > c.at - 2.5 && d < c.at + c.length + 2.5) 
    for (let d = 1; d < PATH_LENGTH - 1; d += 0.9) {
      const u = d / curve.getLength();
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const side = new THREE.Vector3().crossVectors(up, t).normalize();
      const yaw = Math.atan2(t.x, t.z);
      if (near(d)) {
        // Autour d'un diorama : seulement quelques éléments bas côté droit, loin
        if (rnd() > 0.6) { const q = p.clone().addScaledVector(side, 9 + rnd() * 5); out.push({ kind: rnd() > 0.5 ? "tree" : "bush", pos: [q.x, 0, q.z], s: 0.8 + rnd() * 0.6, rot: yaw }); }
        continue;
      }
      // Lampadaire tous les ~6 m, banc de temps en temps, le reste : arbres, buissons, rochers des deux côtés
      const r = rnd();
      if (Math.round(d) % 6 === 0) { const q = p.clone().addScaledVector(side, 1.4); out.push({ kind: "lamp", pos: [q.x, 0, q.z], s: 1, rot: yaw }); }
      if (Math.round(d) % 11 === 0) { const q = p.clone().addScaledVector(side, -1.6); out.push({ kind: "bench", pos: [q.x, 0, q.z], s: 1, rot: yaw }); }
      for (let k = 0; k < 2; k++) {
        const sgn = k === 0 ? -1 : 1;
        const off = 2.4 + rnd() * 7;
        const q = p.clone().addScaledVector(side, sgn * off);
        const rr = rnd();
        out.push({ kind: rr > 0.55 ? "tree" : rr > 0.25 ? "bush" : "rock", pos: [q.x, 0, q.z], s: 0.6 + rnd() * 0.9, rot: rnd() * 6.28 });
      }
      void r;
    }
    return out;
  }, [curve]);
  return (
    <group>
      {items.map((it, i) => {
        switch (it.kind) {
          case "tree": return <Tree key={i} position={it.pos} scale={it.s} color={sunset ? ["#4C8A5A", "#5C9A5A"][i % 2] : ["#5FA86A", "#6DB57A", "#4E9A5F"][i % 3]} />;
          case "bush": return <Bush key={i} position={it.pos} scale={it.s} color={sunset ? "#5A8F5C" : "#6FB56E"} />;
          case "rock": return <Rock key={i} position={[it.pos[0], -0.1, it.pos[2]]} scale={it.s} color={sunset ? "#8A8580" : "#9AA3A8"} />;
          case "lamp": return <LampPost key={i} position={it.pos} rotation={it.rot} sunset={sunset} />;
          case "bench": return <Bench key={i} position={it.pos} rotation={it.rot} />;
        }
      })}
    </group>
  );
}
