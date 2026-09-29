"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping, DepthOfField } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { scroll } from "@/lib/scroll-progress";
import { chapters, PATH_LENGTH, type Clip } from "@/lib/story";
import type { Lang } from "@/lib/content";
import { Character } from "./character";
import { Door, Room } from "./rooms";
import { usePBR } from "./assets";

/** Le chemin : un sentier en S ; les pièces sont traversées de part en part. */
export function buildPath() {
  const pts: THREE.Vector3[] = [];
  for (let d = 0; d <= PATH_LENGTH; d += 4) pts.push(new THREE.Vector3(Math.sin(d * 0.11) * 2.2, 0, -d));
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}

export function World({ sunset, mobile, lang }: { sunset: boolean; mobile: boolean; lang: Lang }) {
  const curve = useMemo(buildPath, []);
  const L = useMemo(() => curve.getLength(), [curve]);
  const dist = useRef(0);
  const speed = useRef(0);
  const [state, setState] = useState<{ walking: boolean; action: Clip; chapter: number }>({ walking: false, action: "idle", chapter: -1 });
  const { camera } = useThree();
  const tmp = useMemo(() => ({ p: new THREE.Vector3(), t: new THREE.Vector3(), side: new THREE.Vector3(), cam: new THREE.Vector3(), look: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), q: new THREE.Quaternion(), m: new THREE.Matrix4() }), []);
  const sun = useRef<THREE.DirectionalLight>(null);
  const grass = usePBR("grass", [40, 80]);
  const gravel = usePBR("gravel", [1, 60]);

  useFrame((_, dt) => {
    const target = scroll.progress * L;
    const prev = dist.current;
    dist.current += (target - dist.current) * Math.min(1, dt * 4);
    speed.current = (dist.current - prev) / Math.max(dt, 1e-3);
    const walking = Math.abs(speed.current) > 0.15;

    let chapter = -1;
    for (let i = 0; i < chapters.length; i++) {
      const c = chapters[i];
      if (dist.current >= c.door - 1.0 && dist.current <= c.door + c.length + 1.0) chapter = i;
    }
    scroll.chapter = chapter;
    const action: Clip = chapter >= 0 ? chapters[chapter].clip : "idle";
    if (walking !== state.walking || action !== state.action || chapter !== state.chapter) setState({ walking, action, chapter });

    const u = THREE.MathUtils.clamp(dist.current / L, 0, 1);
    curve.getPointAt(u, tmp.p);
    curve.getTangentAt(u, tmp.t);
    tmp.side.crossVectors(tmp.up, tmp.t).normalize();
    const inRoom = chapter >= 0;
    const back = mobile ? 3.6 : inRoom ? 4.0 : 5.2;
    const lat = mobile ? 0.3 : inRoom ? 1.7 : 1.5;
    const h = mobile ? 2.5 : inRoom ? 1.55 : 1.85;
    tmp.cam.copy(tmp.p).addScaledVector(tmp.t, -back).addScaledVector(tmp.side, -lat).setY(h);
    // Sur mobile le panneau est en bas : on vise plus bas pour garder le perso dans la moitié haute
    tmp.look.copy(tmp.p).addScaledVector(tmp.t, 2.2).addScaledVector(tmp.side, mobile ? 0 : -0.8).setY(mobile ? -0.2 : 1.05);
    // Fin de l'histoire : la caméra tourne autour de lui et vient le regarder en face
    const end = THREE.MathUtils.smoothstep(u, 0.93, 1);
    if (end > 0) {
      const front = new THREE.Vector3().copy(tmp.p).addScaledVector(tmp.t, 3.6).addScaledVector(tmp.side, -1.4).setY(1.45);
      tmp.cam.lerp(front, end);
      tmp.look.lerp(new THREE.Vector3().copy(tmp.p).addScaledVector(tmp.side, mobile ? 0 : -0.5).setY(1.15), end);
    }
    camera.position.lerp(tmp.cam, Math.min(1, dt * 2.5));
    tmp.m.lookAt(camera.position, tmp.look, tmp.up);
    tmp.q.setFromRotationMatrix(tmp.m);
    camera.quaternion.slerp(tmp.q, Math.min(1, dt * 3));

    if (sun.current) {
      sun.current.position.copy(tmp.p).add(sunset ? new THREE.Vector3(-16, 7, 12) : new THREE.Vector3(8, 18, 6));
      sun.current.target.position.copy(tmp.p);
      sun.current.target.updateMatrixWorld();
    }
  });

  const fogColor = sunset ? "#e0a074" : "#dfe9f0";

  return (
    <>
      <Environment files={sunset ? "/hdri/sunset.hdr" : "/hdri/day.hdr"} background backgroundBlurriness={0.06} environmentIntensity={sunset ? 0.7 : 0.9} backgroundIntensity={sunset ? 0.9 : 1} />
      <fog attach="fog" args={[fogColor, 22, 90]} />
      <directionalLight
        ref={sun}
        intensity={sunset ? 2.4 : 2.8}
        color={sunset ? "#ffa66a" : "#fff3dc"}
        castShadow={!mobile}
        shadow-mapSize={2048}
        shadow-bias={-0.0003}
        shadow-normalBias={0.03}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -PATH_LENGTH / 2]} receiveShadow>
        <planeGeometry args={[120, PATH_LENGTH + 100]} />
        <meshStandardMaterial {...grass} color={sunset ? "#9a8c6c" : "#b8c39a"} roughness={1} />
      </mesh>
      <Trail curve={curve} tex={gravel} />

      {chapters.map((c, i) => (
        <group key={c.id}>
          <Door curve={curve} at={c.door} distanceRef={dist} palette={sunset ? c.sunset : c.day} sunset={sunset} />
          <Room curve={curve} chapter={c} palette={sunset ? c.sunset : c.day} sunset={sunset} active={state.chapter === i} lang={lang} />
        </group>
      ))}

      <Character curve={curve} distanceRef={dist} speedRef={speed} action={state.action} walking={state.walking} handProp={state.chapter === 0 ? "racket" : null} />

      {!mobile && (
        <EffectComposer multisampling={4}>
          <DepthOfField focusDistance={0.02} focalLength={0.06} bokehScale={2.2} />
          <Bloom intensity={sunset ? 0.55 : 0.3} luminanceThreshold={0.8} mipmapBlur />
          <Vignette eskil={false} offset={0.18} darkness={sunset ? 0.5 : 0.32} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}

function Trail({ curve, tex }: { curve: THREE.Curve<THREE.Vector3>; tex: ReturnType<typeof usePBR> }) {
  const geo = useMemo(() => {
    const n = 240, w = 1.6;
    const pos: number[] = [], idx: number[] = [], uv: number[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const p = curve.getPointAt(u), t = curve.getTangentAt(u);
      const s = new THREE.Vector3().crossVectors(up, t).normalize().multiplyScalar(w / 2);
      pos.push(p.x - s.x, 0.006, p.z - s.z, p.x + s.x, 0.006, p.z + s.z);
      uv.push(0, u, 1, u);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }, [curve]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial {...tex} roughness={1} />
    </mesh>
  );
}
