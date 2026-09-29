import * as THREE from "three";

/**
 * Ombres douces à pénombre variable (PCSS), d'après drei/SoftShadows (MIT, @N8Programs).
 * Différence : le code est injecté une seule fois, AVANT la première compilation des programmes de rendu.
 * Le composant de drei l'injectait après coup puis recompilait toute la scène (des secondes de blocage au démarrage).
 */

const pcss = ({ focus, size, samples }: { focus: number; size: number; samples: number }, packedDepth: boolean) => {
  const depthSample = packedDepth ? "unpackRGBAToDepth( texture2D( shadowMap, uv + offset ) )" : "texture2D( shadowMap, uv + offset ).r";
  return `
#define PENUMBRA_FILTER_SIZE float(${size})
#define RGB_NOISE_FUNCTION(uv) (randRGB(uv))
vec3 randRGB(vec2 uv) {
  return vec3(
    fract(sin(dot(uv, vec2(12.75613, 38.12123))) * 13234.76575),
    fract(sin(dot(uv, vec2(19.45531, 58.46547))) * 43678.23431),
    fract(sin(dot(uv, vec2(23.67817, 78.23121))) * 93567.23423)
  );
}
vec3 lowPassRandRGB(vec2 uv) {
  vec3 result = vec3(0);
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(-1.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2( 0.0, +1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, -1.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0,  0.0));
  result += RGB_NOISE_FUNCTION(uv + vec2(+1.0, +1.0));
  result *= 0.111111111;
  return result;
}
vec3 highPassRandRGB(vec2 uv) {
  return RGB_NOISE_FUNCTION(uv) - lowPassRandRGB(uv) + 0.5;
}
vec2 pcssVogelDiskSample(int sampleIndex, int sampleCount, float angle) {
  const float goldenAngle = 2.399963f;
  float r = sqrt(float(sampleIndex) + 0.5f) / sqrt(float(sampleCount));
  float theta = float(sampleIndex) * goldenAngle + angle;
  return vec2(cos(theta), sin(theta)) * r;
}
float penumbraSize( const in float zReceiver, const in float zBlocker ) {
  return (zReceiver - zBlocker) / zBlocker;
}
float findBlocker(sampler2D shadowMap, vec2 uv, float compare, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float blockerDepthSum = float(${focus});
  float blockers = 0.0;
  int j = 0;
  vec2 offset = vec2(0.);
  float depth = 0.;
  #pragma unroll_loop_start
  for(int i = 0; i < ${samples}; i ++) {
    offset = (pcssVogelDiskSample(j, ${samples}, angle) * texelSize) * 2.0 * PENUMBRA_FILTER_SIZE;
    depth = ${depthSample};
    if (depth < compare) {
      blockerDepthSum += depth;
      blockers++;
    }
    j++;
  }
  #pragma unroll_loop_end
  if (blockers > 0.0) return blockerDepthSum / blockers;
  return -1.0;
}
float vogelFilter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius, float angle) {
  float texelSize = 1.0 / float(textureSize(shadowMap, 0).x);
  float shadow = 0.0f;
  int j = 0;
  vec2 vogelSample = vec2(0.0);
  vec2 offset = vec2(0.0);
  #pragma unroll_loop_start
  for (int i = 0; i < ${samples}; i++) {
    vogelSample = pcssVogelDiskSample(j, ${samples}, angle) * texelSize;
    offset = vogelSample * (1.0 + filterRadius * float(${size}));
    shadow += step( zReceiver, ${depthSample} );
    j++;
  }
  #pragma unroll_loop_end
  return shadow * 1.0 / ${samples}.0;
}
float PCSS (sampler2D shadowMap, vec4 coords) {
  vec2 uv = coords.xy;
  float zReceiver = coords.z;
  float angle = highPassRandRGB(gl_FragCoord.xy).r * PI2;
  float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver, angle);
  if (avgBlockerDepth == -1.0) return 1.0;
  float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);
  return vogelFilter(shadowMap, uv, zReceiver, 1.25 * penumbraRatio, angle);
}`;
};

let applied = false;

/** À appeler une fois, dès que le contexte 3D existe et avant tout rendu. */
export function applySoftShadows(gl: THREE.WebGLRenderer, opts = { size: 16, samples: 6, focus: 0.6 }) {
  if (applied) return;
  const original = THREE.ShaderChunk.shadowmap_pars_fragment;
  const packedDepth = !original.includes("sampler2DShadow");
  const start = original.lastIndexOf("float getShadow( sampler2D shadowMap");
  const marker = "if ( frustumTest ) {";
  const end = original.indexOf(marker, start) + marker.length;
  if (start < 0 || end < marker.length) return;
  // Le PCSS lit la profondeur brute : disponible avec la carte d'ombre « basique »
  if (!packedDepth) gl.shadowMap.type = THREE.BasicShadowMap;
  const hasIntensity = original.slice(start, end).includes("shadowIntensity");
  const ret = hasIntensity ? "return mix( 1.0, PCSS( shadowMap, shadowCoord ), shadowIntensity );" : "return PCSS( shadowMap, shadowCoord );";
  THREE.ShaderChunk.shadowmap_pars_fragment = (original.slice(0, end) + "\n" + ret + original.slice(end)).replace(
    "#ifdef USE_SHADOWMAP",
    "#ifdef USE_SHADOWMAP\n" + pcss(opts, packedDepth),
  );
  applied = true;
}
