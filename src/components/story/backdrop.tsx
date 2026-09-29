"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";


/**
 * Arrière-plan réaliste : ciel physique (diffusion atmosphérique de Preetham, nuages procéduraux) et
 * chaîne de montagnes en relief (crêtes fractales, forêts, roche, neige, voile atmosphérique).
 * Les deux suivent la caméra : ils restent à l'horizon comme un décor lointain, sans jamais entrer dans la scène.
 */

/* ───────────── bruit de gradient 2D (Perlin) + fBm + crêtes ───────────── */

function makeNoise(seed: number) {
  const perm = Array.from({ length: 256 }, (_, i) => i);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  const p = new Uint8Array(512);
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h: number, x: number, y: number) => { switch (h & 7) { case 0: return x + y; case 1: return -x + y; case 2: return x - y; case 3: return -x - y; case 4: return x; case 5: return -x; case 6: return y; default: return -y; } };
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y), X = xi & 255, Y = yi & 255;
    const xf = x - xi, yf = y - yi, u = fade(xf), v = fade(yf);
    const a = p[X] + Y, b = p[X + 1] + Y;
    const l1 = grad(p[a], xf, yf) + u * (grad(p[b], xf - 1, yf) - grad(p[a], xf, yf));
    const l2 = grad(p[a + 1], xf, yf - 1) + u * (grad(p[b + 1], xf - 1, yf - 1) - grad(p[a + 1], xf, yf - 1));
    return (l1 + v * (l2 - l1)) * 0.7; // ≈ [-1, 1]
  };
}

const smooth = (x: number, a: number, b: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Chaîne de montagnes : anneau de relief autour de la caméra (rayon 44 → 77 m, sous le plan lointain de 80 m). */
function buildMountains(detail: [number, number]) {
  const n1 = makeNoise(11), n2 = makeNoise(29), n3 = makeNoise(47);
  const fbm = (x: number, y: number, oct = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * n1(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };
  const ridged = (x: number, y: number, oct = 5) => {
    let s = 0, a = 0.55, f = 1, prev = 1;
    for (let i = 0; i < oct; i++) { let r = 1 - Math.abs(n2(x * f, y * f)); r *= r; s += r * a * prev; prev = r; f *= 2.1; a *= 0.5; }
    return s;
  };
  const [A, R] = detail, R0 = 44, R1 = 77;
  const pos = new Float32Array((A + 1) * (R + 1) * 3), haze = new Float32Array((A + 1) * (R + 1)), hts = new Float32Array((A + 1) * (R + 1));
  const idx: number[] = [];
  for (let i = 0; i <= A; i++) {
    const th = (i / A) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    // grandes variations le long de l'horizon : massifs, cols, vallées
    const rangeF = 0.55 + 0.6 * (fbm(c * 2.1 + 4, sn * 2.1 + 9, 3) + 0.5);
    const rangeP = 0.45 + 0.75 * (fbm(c * 1.6 + 7, sn * 1.6 + 3, 3) + 0.5);
    for (let j = 0; j <= R; j++) {
      const t = j / R, r = R0 + (R1 - R0) * t;
      const x = c * r, z = sn * r;
      // 1) collines boisées, proches et basses ; 2) grande chaîne lointaine, crêtes marquées, sommets enneigés
      const foot = Math.exp(-((t - 0.2) ** 2) / 0.018) * (1.2 + 2.2 * ridged(x * 0.05, z * 0.05, 4)) * rangeF;
      const peaks = smooth(t, 0.45, 0.9) * (1.6 + 6.2 * Math.pow(ridged(x * 0.026, z * 0.026), 1.35)) * rangeP;
      let h = Math.max(foot, peaks) + fbm(x * 0.2, z * 0.2, 3) * 0.35 * (0.3 + t) + n3(x * 0.7, z * 0.7) * 0.06;
      h = Math.max(h, 0);
      const k = i * (R + 1) + j;
      pos[k * 3] = x; pos[k * 3 + 1] = h - 0.6; pos[k * 3 + 2] = z;
      hts[k] = h;
      // voile atmosphérique : fort au loin et au pied des reliefs (les plans s'étagent du vert sombre au bleu pâle)
      haze[k] = Math.max(0.12, Math.min(0.95, 0.3 + 0.55 * t + 0.25 * (1 - smooth(h, 0, 3)) - 0.3 * smooth(h, 4.2, 7)));
      if (i < A && j < R) { const a0 = k, b0 = k + R + 1; idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // couleurs : forêt en bas, alpages, roche sur les pentes raides, neige en altitude (limite irrégulière)
  const nor = g.getAttribute("normal") as THREE.BufferAttribute;
  const col = new Float32Array(pos.length);
  const forestA = new THREE.Color("#2F4A2C"), forestB = new THREE.Color("#46633A"), meadow = new THREE.Color("#72804F"), rockA = new THREE.Color("#666159"), rockB = new THREE.Color("#8A8378"), snow = new THREE.Color("#EEF2F6");
  const cc = new THREE.Color(), tmp = new THREE.Color();
  for (let k = 0; k < hts.length; k++) {
    const x = pos[k * 3], z = pos[k * 3 + 2], h = hts[k], ny = nor.getY(k);
    const v = fbm(x * 0.09, z * 0.09, 3) + 0.5;
    cc.copy(forestA).lerp(forestB, Math.min(1, Math.max(0, v)));
    cc.lerp(meadow, smooth(h, 2.6, 4.2) * 0.85);
    tmp.copy(rockA).lerp(rockB, Math.min(1, Math.max(0, n3(x * 0.2, z * 0.2) * 0.5 + 0.5)));
    cc.lerp(tmp, Math.min(1, (1 - smooth(ny, 0.6, 0.8)) * 0.85 + smooth(h, 4, 6) * 0.45));
    const snowLine = 5.6 + 1.2 * fbm(x * 0.05, z * 0.05, 3);
    cc.lerp(snow, smooth(h, snowLine - 0.4, snowLine + 0.9) * smooth(ny, 0.35, 0.6));
    col[k * 3] = cc.r; col[k * 3 + 1] = cc.g; col[k * 3 + 2] = cc.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("aHaze", new THREE.BufferAttribute(haze, 1));
  g.computeBoundingSphere();
  return g;
}

export const Mountains = memo(function Mountains({ sunset, detail }: { sunset: boolean; detail: [number, number] }) {
  const g = useRef<THREE.Group>(null);
  const { camera, scene } = useThree();
  const [A, R] = detail;
  const geo = useMemo(() => buildMountains([A, R]), [A, R]);
  const uni = useMemo(() => ({ uHaze: { value: new THREE.Color() }, uHazeK: { value: 1 } }), []);
  const mat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, envMapIntensity: 0.35, fog: false });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aHaze;\nvarying float vHaze;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvHaze = aHaze;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform vec3 uHaze;\nuniform float uHazeK;\nvarying float vHaze;")
        .replace("#include <fog_fragment>", "#include <fog_fragment>\ngl_FragColor.rgb = mix( gl_FragColor.rgb, uHaze, clamp( vHaze * uHazeK, 0.0, 1.0 ) );");
    };
    m.customProgramCacheKey = () => "mountains";
    return m;
  }, [uni]);
  useEffect(() => { uni.uHazeK.value = sunset ? 1.0 : 0.9; }, [sunset, uni]);
  useFrame(() => {
    if (g.current) g.current.position.set(camera.position.x, 0, camera.position.z);
    const fog = scene.fog as THREE.Fog | null;
    if (fog) uni.uHaze.value.copy(fog.color);
  });
  return (
    <group ref={g}>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
    </group>
  );
});

/** Ciel physique (Preetham) avec nuages, intensité dosée pour notre exposition ; il suit la caméra. */
export const PhysicalSky = memo(function PhysicalSky({ sunset, clouds }: { sunset: boolean; clouds: boolean }) {
  const { camera } = useThree();
  const sky = useMemo(() => {
    const s = new Sky();
    const m = s.material as THREE.ShaderMaterial;
    // Intensité et saturation réglables : le modèle est très pâle près de l'horizon, seule zone que voit la caméra
    m.uniforms.uGain = { value: 0.3 };
    m.uniforms.uSat = { value: 2.6 };
    m.fragmentShader = "uniform float uGain;\nuniform float uSat;\n" + m.fragmentShader.replace(
      "gl_FragColor = vec4( texColor, 1.0 );",
      "vec3 skyC = texColor * uGain;\n float skyL = dot( skyC, vec3( 0.2126, 0.7152, 0.0722 ) );\n skyC = max( mix( vec3( skyL ), skyC, uSat ), 0.0 );\n gl_FragColor = vec4( skyC, 1.0 );",
    );
    s.scale.setScalar(60);
    s.frustumCulled = false;
    s.renderOrder = -10;
    return s;
  }, []);
  useEffect(() => {
    const u = (sky.material as THREE.ShaderMaterial).uniforms;
    // Jour : ciel limpide, soleil haut derrière la caméra. Soir : soleil au ras de l'horizon, devant, lumière chaude.
    // (au soir, le soleil est décalé sur le côté : face à lui, la diffusion vire à l'olive au lieu du rose)
    const sun = sunset ? new THREE.Vector3(0.78, 0.07, -0.62) : new THREE.Vector3(0.45, 0.78, 0.43);
    u.sunPosition.value.copy(sun.normalize());
    u.turbidity.value = sunset ? 4.5 : 2.2;
    u.rayleigh.value = sunset ? 4.2 : 2.4;
    u.mieCoefficient.value = sunset ? 0.004 : 0.003;
    u.mieDirectionalG.value = sunset ? 0.82 : 0.8;
    u.cloudCoverage.value = clouds ? 0.3 : 0; // sans nuages, le calcul par pixel est bien plus léger
    u.cloudDensity.value = 0.5;
    u.cloudElevation.value = 0.6;
    u.uGain.value = sunset ? 0.6 : 0.3;
    u.uSat.value = sunset ? 1.0 : 2.6;
  }, [sky, sunset, clouds]);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") (window as unknown as { __sky: Sky }).__sky = sky;
  }, [sky]);
  useFrame((_, dt) => {
    sky.position.copy(camera.position);
    (sky.material as THREE.ShaderMaterial).uniforms.time.value += dt;
  });
  return <primitive object={sky} />;
});
