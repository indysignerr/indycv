# CV site d'Indy François — brief de session

Le cadrage (20 questions) est FAIT et validé par Indy. Ne pas le reposer. Lire aussi la mémoire du projet (profil, missions, décisions).

## Autorisation durable (donnée par Indy)
Push autorisé sur `https://github.com/indysignerr/indycv.git` (branche `main`), commits réguliers, sans redemander à chaque fois. Jamais de secrets commités. Jamais de Vercel : hébergement Cloudflare Pages uniquement.

## Objectif
Site one-page bilingue FR/EN (FR par défaut), domaine indyfrancois.com, lien épinglé sur son CV. Cible : recruteurs. Stage d'environ 6 semaines à partir du 5 juin 2027. CTA principal : lui écrire à indyfrancois6@gmail.com. Autres coordonnées : 07 69 76 20 76, github.com/indysignerr, LinkedIn indy-françois-37a451284. Pas de CMS. Bouton « Télécharger mon CV » : PDF généré depuis le site (feuille de style print). Photo : assets/source/indy-photo.jpg (à copier dans public/images/ et à détourer au build).

Baseline : « Business, data & code. Un seul cerveau. »

Positionnement : étudiant Mines Paris-PSL × Albert School (Bachelor Business & Data, 2026-2029) et fondateur d'Indysigner. L'alternance compta chez Concertae (Cannes, sept. 2025 – sept. 2026) est une expérience d'1 an, pas son titre. Avant : 1 an de BUT GEA (IUT Nice), bac maths-physique (Lycée Simone Veil). Langues : français courant, anglais bon niveau. Loisirs : tennis (6 ans), padel, foot (8 ans), concerts.

Projets (voir mémoire pour le détail) : Indysigner (indysigner.fr), L'Ovive (lovive.fr), et UNE seule carte « Manika.LAB × Nayuma Tea » (manikalab.com, nayumatea.com). Ne jamais publier tarifs, budgets, commissions clients.

## Design
Palette validée : fond #0B0B10 (sombre) / #F2EFE9 (clair), surface #15151C / #E8E4DC, texte #EDEAE4 / #14121A, discret #8A8794 / #5F5B66, accent vermillon #FF5A36 (sombre) / #C93A18 (clair). Switch clair/sombre. Polices : Bricolage Grotesque (titres), Instrument Serif italique (accents), Geist Mono (labels). Ne jamais réutiliser la palette Indysigner.

## Concept final (mode PREMIUM)
Un seul canvas 3D fixe (React Three Fiber) ; la caméra suit un chemin au scroll (Theatre.js + GSAP + Lenis). On se balade dans sa vie : tennis enfant → foot → lycée (maths/physique) → cabinet comptable, avec en parallèle le lancement d'Indysigner (objets 3D flottants = ses projets cliquables) → Albert School. Personnage stylisé low-poly (option 1 choisie), modélisé via Blender MCP, rigué/animé avec Mixamo (Indy télécharge les animations dans `assets/mixamo/`). Le texte reste en HTML par-dessus (SEO, a11y). Version allégée mobile, version statique si `prefers-reduced-motion`. Poids initial visé < 3 Mo (Draco/meshopt). Autres idées retenues : cycle jour/nuit lié au switch de thème, balle de tennis qui suit le curseur, compteurs animés.

Sources d'effets à réutiliser (licences vérifiées repo par repo, jamais de code de basement.studio copié) : Codrops, React Bits, exemples drei/three, pmndrs.

## Outils connectés
Blender MCP (`blender`, Blender 5.2 ouvert et connecté sur le port 9876), shadcn, stitch, chrome-devtools (Lighthouse, captures), 21st.dev (OAuth fait). Le serveur `magic` est obsolète.

## À FAIRE MAINTENANT — Étape 1 (fondations, sans attendre la 3D)
1. `npx create-next-app@latest` dans ce dossier (TypeScript, Tailwind, App Router, `src/`), puis packages du mode premium selon le CLAUDE.md global. `next.config.mjs` : `output: "export"`, `images.unoptimized`, `trailingSlash`.
2. Structure de dossiers standard (voir CLAUDE.md global), Lenis global, tailwindcss-animate, `prefers-reduced-motion`.
3. Assets SEO obligatoires : favicon set, JSON-LD Person, meta OG, sitemap.xml, robots.txt, `/mentions-legales/` et `/politique-de-confidentialite/`.
4. Page one-page FR/EN complète avec le vrai contenu (hero, parcours, projets, compétences, loisirs, contact), switch thème, bouton CV PDF. Le site doit être présentable SANS la 3D.
5. `git init`, `.gitignore` propre, README minimum, premier commit, remote `origin` = repo indycv, push sur `main`.
6. Vérifier avec `npm run build` (0 warning) puis lancer le dev server et faire des captures via chrome-devtools.

## Étape 2 — dès que l'étape 1 est poussée
Vérifier que les outils Blender sont visibles, modéliser le personnage stylisé (cheveux bruns en volume, polo écru, inspiré de la photo), exporter en FBX pour Mixamo, donner à Indy la liste exacte d'animations à télécharger. Ensuite : canvas + chemin de caméra + scènes une par une (tennis en premier, puis Indysigner avec les projets), optimisation mobile, mise en ligne Cloudflare Pages sur indyfrancois.com (Indy aura besoin d'intervenir pour les DNS).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
