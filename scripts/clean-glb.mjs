// Retire les animations dupliquées (.001) et renomme proprement
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
const [src, dst] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
for (const a of doc.getRoot().listAnimations()) if (/\.\d{3}$/.test(a.getName())) a.dispose();
await io.write(dst, doc);
console.log("animations:", doc.getRoot().listAnimations().map((a) => a.getName()).join(", "));
