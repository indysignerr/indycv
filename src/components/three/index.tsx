"use client";

import dynamic from "next/dynamic";

// Chargé après l'hydratation, hors du chemin critique du LCP
export const Scene3D = dynamic(() => import("./scene-canvas").then((m) => m.SceneCanvas), { ssr: false });
