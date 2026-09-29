# Plan 3D — « On se balade dans sa vie »

Un seul `<Canvas>` R3F fixe derrière le HTML. La caméra suit une courbe (CatmullRom) pilotée par le scroll (Lenis → GSAP ScrollTrigger → `progress` 0..1, animé via Theatre.js pour les séquences fines). Le texte reste en HTML (SEO, a11y).

## Budget & garde-fous
- Poids initial < 3 Mo : GLB compressé Draco/meshopt, textures KTX2 ≤ 1024, chargement du canvas en `dynamic()` après le LCP du hero.
- Mobile : DPR ≤ 1.5, moins d'objets, pas d'ombres portées dynamiques, personnage sans post-process.
- `prefers-reduced-motion` ou WebGL indisponible : le site actuel (sans 3D) reste la version de référence.
- Thème : le switch clair/sombre pilote un cycle jour/nuit (lumières + ciel).

## Chemin de caméra (scroll 0 → 1)
| Progress | Scène | Contenu HTML lié |
|---|---|---|
| 0.00–0.15 | **Court de tennis** (enfant, raquette) | Hero |
| 0.15–0.30 | **Terrain de foot** (frappe, balle) | Parcours |
| 0.30–0.45 | **Lycée** : tableau maths/physique | Parcours (bac) |
| 0.45–0.60 | **Cabinet comptable** (bureau, dossiers) | Parcours (Concertae) |
| 0.60–0.80 | **Atelier Indysigner** : objets flottants = projets cliquables (Indysigner, L'Ovive, Manika.LAB × Nayuma) | Projets |
| 0.80–1.00 | **Albert School × Mines** (bâtiment stylisé, lever de soleil) | Contact |

Extras : balle de tennis 3D qui suit le curseur (déjà en 2D), compteurs animés, concert (foule + lumières) en easter egg dans Loisirs.

## Personnage (Blender MCP → Mixamo)
1. Modélisation low-poly stylisée : cheveux bruns en volume, polo écru, proportions cartoon (réf. `assets/source/indy-photo.jpg`).
2. Export FBX T-pose → Indy l'envoie à Mixamo (auto-rig).
3. Animations à télécharger (FBX, « With Skin » pour la 1re, « Without Skin » ensuite, 30 fps) dans `assets/mixamo/` :
   - Idle (Breathing Idle) · Walking · Running
   - Tennis : Forehand Stroke / Tennis Serve si dispo, sinon « Baseball Swing » en repli
   - Foot : Soccer Kick / Soccer Pass · Celebrate
   - Bureau : Typing · Sitting Idle
   - Lycée : Talking / Writing on board (repli : Idle + Pointing)
   - Concert : Dancing (Hip Hop) · Clapping
4. Conversion en un seul GLB (Blender), `gltf-transform optimize` (Draco + meshopt), chargement via `useGLTF` + `useAnimations`.

## Phases
1. **Socle canvas** : `SceneCanvas` fixe, `useScrollProgress`, chemin de caméra avec objets placeholders, lecture du thème.
2. **Personnage + tennis** (scène 1) → validation avec Indy.
3. **Scènes 2 à 4**, une par une.
4. **Scène Indysigner** : objets cliquables (raycast + focus clavier doublé par les liens HTML).
5. **Scène Albert School**, lumière jour/nuit, post-process léger.
6. **Optimisation mobile** + Lighthouse (LCP < 2.5 s, CLS < 0.1) + fallback.
7. **Mise en ligne** Cloudflare Pages sur indyfrancois.com (DNS à faire par Indy).

## Sources d'effets (licences vérifiées) 
Codrops, React Bits, exemples drei/three, pmndrs. Jamais de code de basement.studio.
