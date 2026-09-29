"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, SoftShadows } from "@react-three/drei";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-progress";
import { chapters, outside, PATH_LENGTH } from "@/lib/story";
import type { Lang } from "@/lib/content";
import { Character } from "./character";
import { Mountains, PhysicalSky } from "./backdrop";
import { Diorama } from "./rooms";
import { Bench, Bush, LampPost, Rock, Tree } from "./props";
import { Grass } from "./grass";
import { TexMat } from "./detail";
import { concreteTex, grassTex } from "./textures";

const CLOSED = ["lycee", "concertae", "indysigner", "albert"];

/** Le chemin : un ruban en S sur l'île. */
export function buildPath() {
  const pts: THREE.Vector3[] = [];
  // Ligne droite : les portes des pièces tombent exactement sur le passage du personnage
  for (let d = 0; d <= PATH_LENGTH; d += 4) pts.push(new THREE.Vector3(0, 0, -d));
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}

export function World({ sunset, mobile, lang }: { sunset: boolean; mobile: boolean; lang: Lang }) {
  const curve = useMemo(buildPath, []);
  const L = useMemo(() => curve.getLength(), [curve]);
  const dist = useRef(0);
  const snap = useRef(true);
  const speed = useRef(0);
  const walkingRef = useRef(false);
  const { camera, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  // Portiques (entrée et sortie de chaque pièce fermée), repérés par leur distance le long du chemin
  const portals = useMemo(() => chapters.filter((c) => CLOSED.includes(c.id)).flatMap((c) => [{ d: c.at - 0.45, c }, { d: c.at + c.length + 0.45, c }]), []);
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), side: new THREE.Vector3(), cam: new THREE.Vector3(), look: new THREE.Vector3(), v1: new THREE.Vector3(), v2: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion(), m: new THREE.Matrix4() }), []);
  // Bâtiments : plans des portes d'entrée et de sortie (distance le long du chemin)
  const buildings = useMemo(() => chapters.filter((c) => CLOSED.includes(c.id)).map((c) => ({ mid: c.at + c.length / 2, dIn: c.at - 0.45, dOut: c.at + c.length + 0.45 })), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const roomLight = useRef<THREE.PointLight>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const cur = useMemo(() => ({ fog: new THREE.Color(), skyTop: new THREE.Color(), skyBot: new THREE.Color() }), []);

  useFrame((_, dt) => {
    const target = scroll.progress * L;
    if (Math.abs(target - dist.current) > L * 0.5) { dist.current = target; snap.current = true; }
    const prev = dist.current;
    dist.current += (target - dist.current) * Math.min(1, dt * 3.5);
    speed.current = (dist.current - prev) / Math.max(dt, 1e-3);
    walkingRef.current = Math.abs(speed.current) > 0.12;
    scroll.dist = dist.current; scroll.walking = walkingRef.current; scroll.speed = speed.current;

    let chapter = -1;
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      if (dist.current >= c.at - 0.5 && dist.current <= c.at + c.length + 0.5) chapter = i;
    }
    scroll.chapter = chapter;

    // Passage d'un portique : impulsion de lumière (max au franchissement) + part « intérieur » (lumière de pièce)
    let pulse = 0, inside = 0;
    for (const pt of portals) {
      const x = (dist.current - pt.d) / 0.7, v = Math.exp(-x * x);
      if (v > pulse) { pulse = v; scroll.portalAccent = (sunset ? pt.c.sunset : pt.c.day).accent; scroll.portalRoom = pt.c.id; }
    }
    for (let i = 0; i < portals.length; i += 2) {
      const a0 = portals[i].d, a1 = portals[i + 1].d;
      inside = Math.max(inside, THREE.MathUtils.smoothstep(dist.current, a0 - 0.3, a0 + 0.8) * (1 - THREE.MathUtils.smoothstep(dist.current, a1 - 0.8, a1 + 0.3)));
    }
    scroll.portal = pulse;
    scroll.inside = inside;
    // L'œil s'adapte : bref éblouissement au seuil, lumière du jour adoucie à l'intérieur
    gl.toneMappingExposure = 1.06 + 0.05 * inside + 0.12 * pulse;
    if (hemi.current) hemi.current.intensity = (sunset ? 0.75 : 0.85) * (1 - 0.1 * inside);
    if (sun.current) sun.current.intensity = (sunset ? 2.5 : 2.9) * (1 - 0.3 * inside);

    // Caméra 3/4 : devant-droite du personnage, légèrement en hauteur ; les dioramas sont à sa gauche
    const u = THREE.MathUtils.clamp(dist.current / L, 0, 1);
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    tmp.side.crossVectors(tmp.up, tmp.t).normalize();
    // 1) Pose « suivi » : derrière-droite du personnage
    tmp.cam.copy(tmp.p).addScaledVector(tmp.t, mobile ? -6.0 : -5.0).addScaledVector(tmp.side, mobile ? 2.6 : 5.0).setY(mobile ? 3.6 : 3.4);
    tmp.look.copy(tmp.p).addScaledVector(tmp.t, 1.0).addScaledVector(tmp.side, mobile ? 0 : -1.6).setY(mobile ? 0.2 : 1.0);
    // 2) Lieux en plein air (tennis, foot) : au milieu, la caméra pivote et cadre le lieu de face
    let k = 0, faceMid = 0;
    for (const cc of chapters) {
      if (CLOSED.includes(cc.id)) continue;
      const mid = cc.at + cc.length / 2;
      const x = 1 - Math.abs(dist.current - mid) / (cc.length / 2 + 1.5);
      const kk = THREE.MathUtils.smoothstep(x, 0.1, 0.6);
      if (kk > k) { k = kk; faceMid = mid; }
    }
    let fovT = mobile ? 50 : 36;
    if (k > 0) {
      const um = THREE.MathUtils.clamp(faceMid / L, 0, 1);
      const ap = curve.getPointAt(um), at = curve.getTangentAt(um);
      const as = new THREE.Vector3().crossVectors(tmp.up, at).normalize();
      const drift = (dist.current - faceMid) * 0.25; // léger suivi latéral du personnage
      const faceCam = ap.clone().addScaledVector(at, drift).addScaledVector(as, mobile ? 11.2 : 8.8).setY(mobile ? 3.3 : 2.7);
      const faceLook = ap.clone().addScaledVector(at, drift * 0.6).addScaledVector(as, -4.6).setY(mobile ? -0.9 : 1.35);
      tmp.cam.lerp(faceCam, k);
      tmp.look.lerp(faceLook, k);
      fovT -= k * (mobile ? 4 : 6);
    }
    // 3) Bâtiments : la caméra se place derrière le personnage et passe la porte avec lui, puis cadre la pièce
    //    depuis l'intérieur (plus rien de l'extérieur) ; à la sortie, elle le rattrape et ressort avec lui.
    let wB = 0, wI = 0, inMid = 0;
    for (const b of buildings) {
      const s0 = dist.current - b.dIn, e0 = dist.current - b.dOut;
      wB = Math.max(wB, THREE.MathUtils.smoothstep(s0, -6.5, -1.5) * (1 - THREE.MathUtils.smoothstep(e0, 3.2, 8)));
      const wi = THREE.MathUtils.smoothstep(s0, 2.9, 4.6) * (1 - THREE.MathUtils.smoothstep(e0, -2.9, -0.5));
      if (wi > wI) { wI = wi; inMid = b.mid; }
    }
    if (wB > 0) {
      // Derrière le personnage, à hauteur d'épaule, décalé à droite : passe dans l'embrasure (2,2 m × 2,6 m)
      tmp.v1.copy(tmp.p).addScaledVector(tmp.t, -2.3).addScaledVector(tmp.side, mobile ? 0.3 : 0.45).setY(mobile ? 1.95 : 2.05);
      tmp.v2.copy(tmp.p).addScaledVector(tmp.t, 5).addScaledVector(tmp.side, -0.25).setY(1.25);
      tmp.cam.lerp(tmp.v1, wB);
      tmp.look.lerp(tmp.v2, wB);
      fovT += ((mobile ? 66 : 52) - fovT) * wB;
    }
    if (wI > 0) {
      // Dans la pièce, entre le chemin et la façade avant : la pièce de face, le personnage suivi
      const um = THREE.MathUtils.clamp(inMid / L, 0, 1);
      const ap = curve.getPointAt(um), at = curve.getTangentAt(um);
      const as = new THREE.Vector3().crossVectors(tmp.up, at).normalize();
      const drift = THREE.MathUtils.clamp((dist.current - inMid) * 0.5, -2.6, 2.6);
      tmp.v1.copy(ap).addScaledVector(at, drift).addScaledVector(as, mobile ? 4.9 : 4.8).setY(mobile ? 2.9 : 2.4);
      tmp.v2.copy(ap).addScaledVector(at, drift * 0.75).addScaledVector(as, -4.8).setY(mobile ? 0.2 : 0.6);
      tmp.cam.lerp(tmp.v1, wI);
      tmp.look.lerp(tmp.v2, wI);
      fovT += ((mobile ? 64 : 46) - fovT) * wI;
    }
    // Respiration de caméra (très légère) : l'image n'est jamais figée
    const tt = performance.now() / 1000;
    tmp.cam.x += Math.sin(tt * 0.31) * 0.05 * (1 - wB * 0.6); tmp.cam.y += Math.sin(tt * 0.47) * 0.035;
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - fovT) > 0.01) { pc.fov += (fovT - pc.fov) * Math.min(1, dt * 2.5); pc.updateProjectionMatrix(); }
    // Près des bâtiments, la caméra colle à sa trajectoire (elle doit passer par la porte, pas à travers le mur)
    camera.position.lerp(tmp.cam, snap.current ? 1 : Math.min(1, dt * (1.5 + 5 * wB)));
    tmp.m.lookAt(camera.position, tmp.look, tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    camera.quaternion.slerp(tmp.q, snap.current ? 1 : Math.min(1, dt * (1.8 + 4 * wB)));
    snap.current = false;

    // Lumière intérieure : une seule, qui se place au plafond de la pièce fermée la plus proche
    if (roomLight.current) {
      let best = 1e9, bi = -1;
      chapters.forEach((cc, i) => { if (!CLOSED.includes(cc.id)) return; const dd = Math.abs(dist.current - (cc.at + cc.length / 2)); if (dd < best) { best = dd; bi = i; } });
      if (bi >= 0) {
        const cc = chapters[bi];
        const um = THREE.MathUtils.clamp((cc.at + cc.length / 2) / L, 0, 1);
        const ap = curve.getPointAt(um), at = curve.getTangentAt(um);
        const as = tmp.side.clone().crossVectors(tmp.up, at).normalize();
        roomLight.current.position.copy(ap).addScaledVector(as, -5).setY(3.0);
        const target = THREE.MathUtils.clamp(1 - (best - cc.length / 2) / 6, 0, 1) * (sunset ? 22 : 12);
        roomLight.current.intensity += (target - roomLight.current.intensity) * Math.min(1, dt * 3);
      }
    }
    if (sun.current) {
      sun.current.position.copy(tmp.p).add(sunset ? new THREE.Vector3(-10, 6, 8) : new THREE.Vector3(6, 14, 5));
      sun.current.target.position.copy(tmp.p);
      sun.current.target.updateMatrixWorld();
    }
    // Couleurs d'ambiance : fondu vers la palette du chapitre
    const pal = chapter >= 0 ? (sunset ? chapters[chapter].sunset : chapters[chapter].day) : (sunset ? outside.sunset : outside.day);
    cur.skyTop.set(pal.fog);
    cur.fog.lerp(cur.skyTop, Math.min(1, dt * 1.5));
    if (fogRef.current) fogRef.current.color.copy(cur.fog);
  });

  const o = sunset ? outside.sunset : outside.day;

  return (
    <>
      {/* Décor lointain réaliste : ciel physique avec nuages, chaîne de montagnes en relief */}
      <PhysicalSky sunset={sunset} mobile={mobile} />
      <Mountains sunset={sunset} mobile={mobile} />
      {/* Éclairage d'ambiance synthétique (studio) : reflets doux sur les matières plates, sans HDRI */}
      <Environment resolution={128} frames={1}>
        <Lightformer intensity={sunset ? 2.2 : 1.6} color={sunset ? "#FFB27A" : "#FFFFFF"} position={[0, 8, -6]} scale={[14, 6, 1]} />
        <Lightformer intensity={0.7} color={sunset ? "#FFD9B0" : "#DCEBFF"} position={[-8, 3, 4]} scale={[6, 10, 1]} rotation={[0, Math.PI / 3, 0]} />
        <Lightformer intensity={0.4} color={sunset ? "#8A5A4A" : "#BFD7A8"} position={[0, -5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[20, 20, 1]} />
      </Environment>
      <fog ref={fogRef} attach="fog" args={[o.fog, 14, 46]} />
      {/* Éclairage trois points : ciel froid, soleil chaud, contour opposé pour détacher les silhouettes */}
      <hemisphereLight ref={hemi} args={[sunset ? "#FFB98E" : "#D6E6FF", sunset ? "#4E3F4A" : "#6F7F66", sunset ? 0.75 : 0.85]} />
      <directionalLight position={[-8, 6, -10]} intensity={sunset ? 0.9 : 0.55} color={sunset ? "#B79CFF" : "#CFE3FF"} />
      <directionalLight ref={sun} intensity={sunset ? 2.5 : 2.9} color={sunset ? "#FFA56A" : "#FFF0D8"} castShadow={!mobile}
        shadow-mapSize={mobile ? 512 : 1024} shadow-bias={-0.0004} shadow-normalBias={0.04}
        shadow-camera-near={1} shadow-camera-far={45} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      {!mobile && <SoftShadows size={16} samples={6} focus={0.6} />}
      <pointLight ref={roomLight} intensity={0} distance={15} decay={2} color={sunset ? "#FFE0B8" : "#FFF8EE"} />

      {/* L'île : une dalle qui suit le chemin, bords doux, rien au-delà */}
      <Island curve={curve} ground={o.ground} path={o.path} />
      <Lawn sunset={sunset} mobile={mobile} />
      <Scenery curve={curve} sunset={sunset} />

      {chapters.map((c) => (
        <Diorama key={c.id} curve={curve} chapter={c} palette={sunset ? c.sunset : c.day} sunset={sunset} distanceRef={dist} lang={lang} />
      ))}

      <Character curve={curve} distanceRef={dist} speedRef={speed} walkingRef={walkingRef} />
    </>
  );
}

/** Chemin de dalles : une dalle arrondie tous les 0,95 m, orientée le long de la courbe. */
function Tiles({ curve, color }: { curve: THREE.Curve<THREE.Vector3>; color: string }) {
  const stoneT = useMemo(() => concreteTex([1, 1]), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  const mats = useMemo(() => {
    const out: THREE.Matrix4[] = [];
    const Lc = curve.getLength(), up = new THREE.Vector3(0, 1, 0), o = new THREE.Object3D();
    const closed = chapters.filter((c) => CLOSED.includes(c.id));
    let i = 0;
    for (let d = 0.5; d < Lc; d += 0.95, i++) {
      if (closed.some((c) => d > c.at - 0.3 && d < c.at + c.length + 0.3)) continue;
      const u = d / Lc, p = curve.getPointAt(u), t = curve.getTangentAt(u);
      o.position.set(p.x + ((i * 37) % 7 - 3) * 0.012, 0.02, p.z);
      o.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(t, new THREE.Vector3(), up));
      o.rotateY(((i * 13) % 5 - 2) * 0.03);
      o.updateMatrix();
      out.push(o.matrix.clone());
    }
    return out;
  }, [curve]);
  useEffect(() => {
    mats.forEach((m, i) => ref.current?.setMatrixAt(i, m));
    if (ref.current) { ref.current.instanceMatrix.needsUpdate = true; ref.current.computeBoundingSphere(); }
  }, [mats]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, mats.length]} receiveShadow castShadow>
      <boxGeometry args={[1.1, 0.07, 0.72]} />
      <TexMat tex={stoneT} color={color} bump={0.01} rough={0.85} />
    </instancedMesh>
  );
}

const Island = memo(function Island({ curve, ground, path }: { curve: THREE.Curve<THREE.Vector3>; ground: string; path: string }) {
  const groundT = useMemo(() => grassTex([110, 135], false), []);
  return (
    <group>
      {/* Sol immense : ses bords se perdent dans la brume, jamais visibles */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -PATH_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[260, 320]} />
        <TexMat tex={groundT} color={ground} bump={0.01} rough={0.95} />
      </mesh>
      <Tiles curve={curve} color={path} />
    </group>
  );
});

/** Arbres et rochers semés le long du chemin, hors des dioramas, jamais sur le sentier. */
const Scenery = memo(function Scenery({ curve, sunset }: { curve: THREE.Curve<THREE.Vector3>; sunset: boolean }) {
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
      if (Math.round(d) % 6 === 0) { const q = p.clone().addScaledVector(side, -1.4); out.push({ kind: "lamp", pos: [q.x, 0, q.z], s: 1, rot: yaw }); }
      if (Math.round(d) % 11 === 0) { const q = p.clone().addScaledVector(side, -2.0); out.push({ kind: "bench", pos: [q.x, 0, q.z], s: 1, rot: yaw }); }
      for (let k = 0; k < 2; k++) {
        const sgn = k === 0 ? -1 : 1;
        const off = sgn < 0 ? 2.6 + rnd() * 8 : 7.5 + rnd() * 7; // côté caméra : loin, pour ne jamais masquer le perso
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
});

/**
 * Herbe animée : uniquement le gazon court du terrain de foot (le reste du sol reste une pelouse dessinée, plus calme).
 * Coordonnées monde : le chemin suit -z ; les pièces sont côté +x, la caméra côté -x.
 */
const Lawn = memo(function Lawn({ sunset, mobile }: { sunset: boolean; mobile: boolean }) {
  const pitch = useMemo(() => {
    const foot = chapters.find((c) => c.id === "foot")!;
    return [[-2.5, 9.8, -(foot.at + foot.length + 0.5), -(foot.at - 0.5)]] as [number, number, number, number][];
  }, []);
  const pitchEx = useMemo(() => [[-0.75, 0.75, -200, 10]] as [number, number, number, number][], []);
  return <Grass areas={pitch} exclude={pitchEx} count={mobile ? 3000 : 12000} base={sunset ? "#4E7F45" : "#5EA654"} tip={sunset ? "#95B868" : "#9DD878"} height={0.08} />;
});
