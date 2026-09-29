// Allège le modèle du personnage pour le web : animations inutilisées retirées, images clés simplifiées,
// textures 512 px, géométrie et animations compressées (meshopt, filtres sans quantification : la géométrie
// reste en flottants une fois décodée, ce dont les figurants ont besoin ; décodage dans le navigateur, sans serveur externe).
// Usage : node scripts/optimize-model.mjs <source.glb> <sortie.glb>
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, resample, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const [src, dst] = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.decoder": MeshoptDecoder, "meshopt.encoder": MeshoptEncoder });
const doc = await io.read(src);

// Animations réellement jouées par le site (personnage : walk/idle ; figurants : le reste)
const KEEP = new Set(["walk", "idle", "tennis-forehand", "sit-idle", "celebrate", "look-around", "write-board", "typing"]);
for (const a of doc.getRoot().listAnimations()) if (!KEEP.has(a.getName())) a.dispose();

// Pistes inutiles : échelle (toujours 1 chez Mixamo) et translations constantes égales à la pose de repos
// (seule la hanche se déplace vraiment). Le mélangeur laisse alors ces os à leur position d'origine.
const close = (a, b) => Math.abs(a - b) < 1e-4;
let dropped = 0;
for (const anim of doc.getRoot().listAnimations()) {
  for (const ch of anim.listChannels()) {
    const path = ch.getTargetPath(), node = ch.getTargetNode(), out = ch.getSampler()?.getOutput();
    if (!node || !out) continue;
    let useless = false;
    if (path === "scale") {
      const rest = node.getScale();
      useless = true;
      for (let i = 0; i < out.getCount() && useless; i++) { const v = out.getElement(i, []); useless = v.every((x, k) => close(x, rest[k])); }
    } else if (path === "translation") {
      const rest = node.getTranslation();
      useless = true;
      for (let i = 0; i < out.getCount() && useless; i++) { const v = out.getElement(i, []); useless = v.every((x, k) => close(x, rest[k])); }
    }
    if (useless) { ch.getSampler().dispose(); ch.dispose(); dropped++; }
  }
}
console.log("pistes retirées :", dropped);

await doc.transform(
  resample({ tolerance: 1e-4 }),
  prune(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [512, 512], quality: 86 }),
);
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write(dst, doc);
console.log("animations :", doc.getRoot().listAnimations().map((a) => a.getName()).join(", "));
