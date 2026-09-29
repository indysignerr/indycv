"use client";

import { Float } from "@react-three/drei";
import { Flat } from "./materials";

/* Décors dessinés en géométrie simple : même langage visuel partout. */

export function Tree({ position, scale = 1, color = "#5FA86A", trunk = "#7A5537" }: { position: [number, number, number]; scale?: number; color?: string; trunk?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.09, 0.13, 1, 7]} /><Flat color={trunk} /></mesh>
      <mesh position={[0, 1.35, 0]} castShadow><coneGeometry args={[0.75, 1.5, 7]} /><Flat color={color} flat /></mesh>
      <mesh position={[0, 2.25, 0]} castShadow><coneGeometry args={[0.52, 1.2, 7]} /><Flat color={color} flat /></mesh>
    </group>
  );
}

export function Rock({ position, scale = 1, color = "#9AA3A8" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <mesh position={position} scale={scale} rotation={[0.3, 0.8, 0.1]} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.4, 0]} /><Flat color={color} flat />
    </mesh>
  );
}

export function TennisCourt({ width = 7, length = 9, color = "#3F8F63", lines = "#F6F6EE" }: { width?: number; length?: number; color?: string; lines?: string }) {
  const L = (args: [number, number, number], pos: [number, number, number]) => (
    <mesh position={pos} receiveShadow><boxGeometry args={args} /><Flat color={lines} /></mesh>
  );
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow><planeGeometry args={[width, length]} /><Flat color={color} /></mesh>
      {L([width, 0.02, 0.07], [0, 0.02, length / 2 - 0.05])}
      {L([width, 0.02, 0.07], [0, 0.02, -length / 2 + 0.05])}
      {L([0.07, 0.02, length], [width / 2 - 0.05, 0.02, 0])}
      {L([0.07, 0.02, length], [-width / 2 + 0.05, 0.02, 0])}
      {L([width - 1.4, 0.02, 0.06], [0, 0.02, length / 4])}
      {L([width - 1.4, 0.02, 0.06], [0, 0.02, -length / 4])}
      {L([0.06, 0.02, length / 2], [0, 0.02, 0])}
      {/* Filet */}
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[width + 0.4, 0.95, 0.03]} /><meshStandardMaterial color="#F3F3F0" transparent opacity={0.55} roughness={1} /></mesh>
      <mesh position={[0, 0.98, 0]}><boxGeometry args={[width + 0.4, 0.06, 0.05]} /><Flat color="#F6F6EE" /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * (width / 2 + 0.2), 0.55, 0]} castShadow><cylinderGeometry args={[0.05, 0.05, 1.1, 8]} /><Flat color="#2A2A2E" /></mesh>)}
    </group>
  );
}

export function TennisBall({ position }: { position: [number, number, number] }) {
  return <mesh position={position} castShadow><sphereGeometry args={[0.07, 12, 10]} /><Flat color="#D7F03B" /></mesh>;
}

export function Goal({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const post = (pos: [number, number, number], args: [number, number, number, number]) => (
    <mesh position={pos} castShadow><cylinderGeometry args={args} /><Flat color="#F4F4F2" roughness={0.6} /></mesh>
  );
  return (
    <group position={position} rotation={rotation}>
      {post([-2, 1.1, 0], [0.06, 0.06, 2.2, 8])}
      {post([2, 1.1, 0], [0.06, 0.06, 2.2, 8])}
      <mesh position={[0, 2.2, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.06, 0.06, 4.12, 8]} /><Flat color="#F4F4F2" roughness={0.6} /></mesh>
      <mesh position={[0, 1.1, -0.6]} rotation={[0.35, 0, 0]}><planeGeometry args={[4, 2.4]} /><meshStandardMaterial color="#FFFFFF" transparent opacity={0.35} side={2} roughness={1} /></mesh>
    </group>
  );
}

export function SoccerBall({ position }: { position: [number, number, number] }) {
  return <mesh position={position} castShadow><icosahedronGeometry args={[0.13, 1]} /><Flat color="#F7F7F5" flat /></mesh>;
}

export function Chalkboard({ position, rotation = [0, 0, 0], accent = "#F5B942" }: { position: [number, number, number]; rotation?: [number, number, number]; accent?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.55, 0]} castShadow><boxGeometry args={[3.2, 1.7, 0.08]} /><Flat color="#2F4A3E" roughness={0.9} /></mesh>
      <mesh position={[0, 1.55, -0.02]}><boxGeometry args={[3.35, 1.85, 0.06]} /><Flat color="#7A5537" /></mesh>
      {/* Traits de craie */}
      {[0.35, 0.1, -0.15, -0.4].map((y, i) => (
        <mesh key={i} position={[-0.6 + i * 0.25, 1.55 + y, 0.045]}><boxGeometry args={[1.6 - i * 0.3, 0.025, 0.005]} /><Flat color={i === 1 ? accent : "#E9E4D6"} emissive={i === 1 ? accent : "#000"} emissiveIntensity={i === 1 ? 0.4 : 0} /></mesh>
      ))}
    </group>
  );
}

export function Desk({ position, rotation = [0, 0, 0], top = "#C9A97A", legs = "#4A4654", screen = false, accent = "#4D86FF" }: { position: [number, number, number]; rotation?: [number, number, number]; top?: string; legs?: string; screen?: boolean; accent?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[1.4, 0.06, 0.7]} /><Flat color={top} /></mesh>
      {[[-0.62, -0.28], [0.62, -0.28], [-0.62, 0.28], [0.62, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow><boxGeometry args={[0.06, 0.72, 0.06]} /><Flat color={legs} /></mesh>
      ))}
      {screen && (
        <group position={[0, 0.77, -0.15]}>
          <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.62, 0.4, 0.03]} /><Flat color="#1B1A22" roughness={0.4} /></mesh>
          <mesh position={[0, 0.28, 0.017]}><planeGeometry args={[0.56, 0.34]} /><Flat color={accent} emissive={accent} emissiveIntensity={0.9} /></mesh>
          <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[0.03, 0.05, 0.08, 8]} /><Flat color="#1B1A22" /></mesh>
          <mesh position={[0, 0.005, 0.25]}><boxGeometry args={[0.42, 0.012, 0.14]} /><Flat color="#E6E2DA" /></mesh>
        </group>
      )}
      <mesh position={[0, 0.36, 0]} castShadow><boxGeometry args={[0.32, 0.02, 0.38]} /><Flat color={legs} /></mesh>
    </group>
  );
}

export function Chair({ position, rotation = [0, 0, 0], color = "#4A4654" }: { position: [number, number, number]; rotation?: [number, number, number]; color?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.44, 0.05, 0.44]} /><Flat color={color} /></mesh>
      <mesh position={[0, 0.72, -0.2]} castShadow><boxGeometry args={[0.44, 0.5, 0.05]} /><Flat color={color} /></mesh>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.22, z]}><boxGeometry args={[0.04, 0.44, 0.04]} /><Flat color={color} /></mesh>
      ))}
    </group>
  );
}

export function Bookshelf({ position, rotation = [0, 0, 0], wood = "#7A5537", books = ["#FF5A36", "#2A4BD7", "#F5B942", "#5FA86A", "#E9E4D6"] }: { position: [number, number, number]; rotation?: [number, number, number]; wood?: string; books?: string[] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[1.2, 2.2, 0.35]} /><Flat color={wood} /></mesh>
      {[0.35, 0.9, 1.45, 2.0].map((y, r) => (
        <group key={r}>
          <mesh position={[0, y - 0.02, 0.02]}><boxGeometry args={[1.1, 0.04, 0.34]} /><Flat color="#5C3F2A" /></mesh>
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[-0.47 + i * 0.155, y + 0.19 + ((i * 7 + r) % 3) * 0.02, 0.03]} castShadow>
              <boxGeometry args={[0.11, 0.36 + ((i + r) % 3) * 0.04, 0.26]} /><Flat color={books[(i + r) % books.length]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Laptop({ position, rotation = [0, 0, 0], accent = "#FF5A36" }: { position: [number, number, number]; rotation?: [number, number, number]; accent?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow><boxGeometry args={[0.36, 0.015, 0.25]} /><Flat color="#D8D6D1" roughness={0.5} /></mesh>
      <group position={[0, 0.0075, -0.125]} rotation={[-1.25, 0, 0]}>
        <mesh position={[0, 0.12, 0]} castShadow><boxGeometry args={[0.36, 0.24, 0.012]} /><Flat color="#D8D6D1" roughness={0.5} /></mesh>
        <mesh position={[0, 0.12, 0.007]}><planeGeometry args={[0.32, 0.2]} /><Flat color={accent} emissive={accent} emissiveIntensity={1.1} /></mesh>
      </group>
    </group>
  );
}

export function ProjectCard({ position, label, accent, active }: { position: [number, number, number]; label: string; accent: string; active: boolean }) {
  return (
    <Float speed={1.3} rotationIntensity={0.25} floatIntensity={0.6}>
      <group position={position} rotation={[0, 0.5, 0]}>
        <mesh castShadow><boxGeometry args={[1.1, 0.68, 0.05]} /><Flat color="#1B1A22" roughness={0.35} emissive={accent} emissiveIntensity={active ? 0.35 : 0.08} /></mesh>
        <mesh position={[-0.3, 0.16, 0.03]}><boxGeometry args={[0.36, 0.05, 0.005]} /><Flat color={accent} emissive={accent} emissiveIntensity={0.8} /></mesh>
        {[0, 1, 2].map((i) => <mesh key={i} position={[-0.15 + i * 0.05, -0.05 - i * 0.09, 0.03]}><boxGeometry args={[0.66 - i * 0.12, 0.03, 0.005]} /><Flat color="#8A8794" /></mesh>)}
      </group>
    </Float>
  );
}

export function Lamp({ position, color = "#FFE7B8", intensity = 6 }: { position: [number, number, number]; color?: string; intensity?: number }) {
  return (
    <group position={position}>
      <mesh castShadow><cylinderGeometry args={[0.14, 0.24, 0.16, 12, 1, true]} /><meshStandardMaterial color="#2A2A2E" side={2} roughness={0.8} /></mesh>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.012, 0.012, 0.9, 6]} /><Flat color="#2A2A2E" /></mesh>
      <pointLight color={color} intensity={intensity} distance={7} decay={2} position={[0, -0.1, 0]} />
    </group>
  );
}

export function Bush({ position, scale = 1, color = "#6FB56E" }: { position: [number, number, number]; scale?: number; color?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow><icosahedronGeometry args={[0.45, 1]} /><Flat color={color} flat /></mesh>
      <mesh position={[0.35, 0.28, 0.1]} castShadow><icosahedronGeometry args={[0.32, 1]} /><Flat color={color} flat /></mesh>
      <mesh position={[-0.3, 0.25, -0.15]} castShadow><icosahedronGeometry args={[0.28, 1]} /><Flat color={color} flat /></mesh>
    </group>
  );
}

export function LampPost({ position, rotation = 0, sunset }: { position: [number, number, number]; rotation?: number; sunset: boolean }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.04, 0.06, 3.2, 8]} /><Flat color="#2A2A2E" /></mesh>
      <mesh position={[-0.35, 3.15, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.035, 0.035, 0.7, 8]} /><Flat color="#2A2A2E" /></mesh>
      <mesh position={[-0.7, 3.05, 0]}><sphereGeometry args={[0.13, 12, 10]} /><Flat color="#FFF0C8" emissive="#FFE1A0" emissiveIntensity={sunset ? 1.4 : 0.15} /></mesh>
    </group>
  );
}

export function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.45, 0.06, 1.6]} /><Flat color="#8A6A48" /></mesh>
      <mesh position={[-0.2, 0.7, 0]} castShadow><boxGeometry args={[0.06, 0.45, 1.6]} /><Flat color="#8A6A48" /></mesh>
      {[-0.65, 0.65].map((z) => <mesh key={z} position={[0, 0.22, z]}><boxGeometry args={[0.4, 0.44, 0.06]} /><Flat color="#2A2A2E" /></mesh>)}
    </group>
  );
}

/** Parquet : lames légèrement plus foncées posées sur la dalle. */
export function Parquet({ width, length, color = "#C9A57A", dark = "#B08D63" }: { width: number; length: number; color?: string; dark?: string }) {
  const rows = Math.floor(width / 0.26);
  return (
    <group>
      {Array.from({ length: rows }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2 + 0.13 + i * 0.26, 0.03, 0]} receiveShadow>
          <planeGeometry args={[0.24, length]} /><Flat color={i % 3 === 1 ? dark : color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Moquette bleue le long du chemin. */
export function Carpet({ length, color = "#2F4FB5", width = 1.9 }: { length: number; color?: string; width?: number }) {
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]} receiveShadow><planeGeometry args={[width, length]} /><Flat color={color} roughness={1} /></mesh>;
}

/** Grand lit double. */
export function Bed({ position, rotation = [0, 0, 0], accent = "#FF5A36", frame = "#8A6A48" }: { position: [number, number, number]; rotation?: [number, number, number]; accent?: string; frame?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow><boxGeometry args={[1.8, 0.44, 2.1]} /><Flat color={frame} /></mesh>
      <mesh position={[0, 0.52, 0.05]} castShadow><boxGeometry args={[1.72, 0.18, 1.95]} /><Flat color="#F5F1EA" /></mesh>
      <mesh position={[0, 0.64, 0.25]} castShadow><boxGeometry args={[1.72, 0.08, 1.4]} /><Flat color={accent} /></mesh>
      {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, 0.68, -0.72]} castShadow><boxGeometry args={[0.7, 0.14, 0.45]} /><Flat color="#FFFFFF" /></mesh>)}
      <mesh position={[0, 0.75, -1.02]} castShadow><boxGeometry args={[1.8, 0.9, 0.08]} /><Flat color={frame} /></mesh>
    </group>
  );
}

/** Placard ouvert rempli de Legos (petites briques colorées). */
export function LegoShelf({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const colors = ["#E3352B", "#2E63D6", "#F2C01E", "#3AA95A", "#FFFFFF", "#111111", "#F27E2B"];
  let seed = 3;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  return (
    <group position={position} rotation={rotation}>
      {/* Placard ouvert : fond, côtés, dessus */}
      <mesh position={[0, 1.1, -0.23]} castShadow receiveShadow><boxGeometry args={[1.3, 2.2, 0.04]} /><Flat color="#F4F1EA" /></mesh>
      {[-0.64, 0.64].map((x) => <mesh key={x} position={[x, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[0.04, 2.2, 0.5]} /><Flat color="#F4F1EA" /></mesh>)}
      <mesh position={[0, 2.2, 0]} castShadow><boxGeometry args={[1.3, 0.04, 0.5]} /><Flat color="#F4F1EA" /></mesh>
      {[0.05, 0.55, 1.05, 1.55].map((y, r) => (
        <group key={r}>
          <mesh position={[0, y - 0.02, 0]} receiveShadow><boxGeometry args={[1.26, 0.04, 0.5]} /><Flat color="#DDD8CF" /></mesh>
          {Array.from({ length: 14 }).map((_, i) => {
            const w = 0.08 + rnd() * 0.12, h = 0.06 + rnd() * 0.1, d = 0.08 + rnd() * 0.14;
            return (
              <mesh key={i} position={[-0.55 + (i / 13) * 1.1, y + h / 2, -0.15 + rnd() * 0.3]} rotation={[0, rnd() * 0.6, 0]} castShadow>
                <boxGeometry args={[w, h, d]} /><Flat color={colors[Math.floor(rnd() * colors.length)]} roughness={0.5} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/** Grand bureau avec trois écrans. */
export function BigDesk({ position, rotation = [0, 0, 0], accent = "#FF5A36", top = "#D9BE94" }: { position: [number, number, number]; rotation?: [number, number, number]; accent?: string; top?: string }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.74, 0]} castShadow receiveShadow><boxGeometry args={[2.4, 0.05, 0.8]} /><Flat color={top} /></mesh>
      {[-1.1, 1.1].map((x) => <mesh key={x} position={[x, 0.36, 0]} castShadow><boxGeometry args={[0.08, 0.72, 0.7]} /><Flat color="#2A2A2E" /></mesh>)}
      {[-0.78, 0, 0.78].map((x, i) => (
        <group key={i} position={[x, 0.77, -0.22]} rotation={[0, (1 - i) * 0.25, 0]}>
          <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.7, 0.42, 0.03]} /><Flat color="#1B1A22" roughness={0.4} /></mesh>
          <mesh position={[0, 0.3, 0.017]}><planeGeometry args={[0.64, 0.36]} /><Flat color={i === 1 ? accent : "#3B4C6B"} emissive={i === 1 ? accent : "#3B4C6B"} emissiveIntensity={0.9} /></mesh>
          <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.03, 0.06, 0.1, 8]} /><Flat color="#1B1A22" /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.775, 0.2]}><boxGeometry args={[0.5, 0.015, 0.16]} /><Flat color="#E6E2DA" /></mesh>
      <mesh position={[0.45, 0.775, 0.2]}><boxGeometry args={[0.07, 0.02, 0.11]} /><Flat color="#E6E2DA" /></mesh>
    </group>
  );
}
