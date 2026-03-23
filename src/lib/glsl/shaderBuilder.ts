
import * as THREE from 'three';
import { AppState, TextureType } from '../../core/types/types';
import { PATTERN_MAP } from '../../data/patterns';
import { SHADER_CHUNKS } from './glslChunks';

// --- GLSL 3.0 STANDARD VERTEX SHADER ---
export const VERTEX_SHADER = `
// Outputs to Fragment Shader
out vec2 vUv;
out vec3 vNormal;
out vec3 vViewPosition;
out vec3 vWorldPosition;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  
  // Standard PBR Transform
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  
  vec4 mvPosition = viewMatrix * worldPosition;
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FALLBACK_SHADER = `
layout(location = 0) out vec4 pc_fragColor;
void main() {
    pc_fragColor = vec4(1.0, 0.0, 1.0, 1.0); // MAGENTA ERROR
}
`;

/**
 * Robust comment stripper.
 * Handles line and block style comments.
 */
function stripComments(code: string): string {
    return code.replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '$1');
}

/**
 * Renames local helper functions in the shader code to prevent collisions 
 * when blending the same pattern with itself or another pattern using common names.
 */
function mangleFunctionNames(code: string, suffix: string): string {
    // Regex to find function definitions: type name(args) {
    // Excludes 'getPattern' as it is handled separately.
    const funcRegex = /^\s*(float|vec2|vec3|vec4|void|int|bool)\s+([a-zA-Z0-9_]+)\s*\(/gm;
    
    let mangledCode = code;
    let match;
    const functionsToRename: string[] = [];

    // 1. Identify functions
    while ((match = funcRegex.exec(code)) !== null) {
        const name = match[2];
        if (name !== 'getPattern' && name !== 'main') {
            functionsToRename.push(name);
        }
    }

    // 2. Rename definitions and calls
    // Sort by length desc to avoid replacing substrings (e.g. 'noise' vs 'snoise')
    functionsToRename.sort((a, b) => b.length - a.length);

    functionsToRename.forEach(name => {
        const newName = `${name}_${suffix}`;
        // Replace definition
        // Use a precise regex to match whole words only to avoid replacing substrings
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        mangledCode = mangledCode.replace(regex, newName);
    });

    return mangledCode;
}

/**
 * Renames the main pattern function to avoid collisions during blending.
 * Uses a relaxed regex to handle whitespace variations like `float getPattern ( vec2 uv )`.
 */
function processShaderForLayer(rawCode: string, suffix: string): string {
  try {
      let processed = stripComments(rawCode);
      
      // If this is the blend layer, we MUST mangle local helper functions
      // to avoid redefinition errors if the same pattern is used twice.
      if (suffix === 'Blend') {
          processed = mangleFunctionNames(processed, 'Blend');
      }
      
      // Robust Regex:
      // float \s+ getPattern \s* ( \s* vec2 \s+ [a-zA-Z0-9_]+ \s* )
      const signatureRegex = /float\s+getPattern\s*\(\s*vec2\s+[a-zA-Z0-9_]+\s*\)/m;
      
      if (!signatureRegex.test(processed)) {
          console.warn(`Shader Builder: Could not find 'getPattern' signature in code for ${suffix}. Using fallback.`);
          return `float getPattern${suffix}(vec2 uv) { return 0.0; }`;
      }

      // Rename function definition
      processed = processed.replace(signatureRegex, `float getPattern${suffix}(vec2 uv)`);

      // Rename uniforms if this is the Blend layer
      if (suffix === 'Blend') {
          processed = processed.replace(/\bu_scale\b/g, 'u_blendScale');
          processed = processed.replace(/\bu_intensity\b/g, 'u_blendIntensity');
          processed = processed.replace(/\bu_factor\b/g, 'u_blendFactor');
          processed = processed.replace(/\bu_detail\b/g, 'u_blendDetail');
          processed = processed.replace(/\bu_seed\b/g, 'u_blendSeed');
      }
      return processed;
  } catch (e) {
      console.error("Shader Processing Error:", e);
      return `float getPattern${suffix}(vec2 uv) { return 0.0; }`;
  }
}

function getRequiredChunks(deps: string[]): string {
    const resolvedDeps = new Set(deps);
    // Auto-resolve dependencies
    if (resolvedDeps.has('curl')) resolvedDeps.add('simplex');
    if (resolvedDeps.has('voronoi-rocks')) resolvedDeps.add('voronoi');
    
    let chunks = SHADER_CHUNKS.BASE_NOISE + '\n';
    chunks += SHADER_CHUNKS.CLASSIC_NOISE + '\n';
    chunks += SHADER_CHUNKS.SPECTRAL_LIB + '\n';

    const included = new Set<string>();
    
    // Maintain order if possible, though functions are usually independent
    resolvedDeps.forEach(dep => {
        if (included.has(dep)) return;
        included.add(dep);
        
        if (dep === 'simplex') chunks += SHADER_CHUNKS.SIMPLEX_NOISE;
        if (dep === 'value') chunks += SHADER_CHUNKS.VALUE_NOISE;
        if (dep === 'fbm') chunks += SHADER_CHUNKS.FBM;
        if (dep === 'voronoi') chunks += SHADER_CHUNKS.VORONOI;
        if (dep === 'curl') chunks += SHADER_CHUNKS.CURL_NOISE;
        if (dep === 'gyroid') chunks += SHADER_CHUNKS.GYROID;
        if (dep === 'sdf') chunks += SHADER_CHUNKS.SDF_LIB;
    });
    
    return chunks + `\n#define HAS_NOISE\n`;
}

export const getFragmentShaderForParams = (state: AppState): string => {
    try {
        const mainType = state.textureType;
        const blending = state.blending;
        
        const mainDef = PATTERN_MAP[mainType];
        if (!mainDef) return FALLBACK_SHADER;
        
        const mainLogic = processShaderForLayer(mainDef.code, 'Main');
        const mainDeps = mainDef.deps || [];

        let blendLogic = "";
        let blendDeps: string[] = [];
        
        if (blending.enabled) {
            const blendDef = PATTERN_MAP[blending.type] || PATTERN_MAP[TextureType.PERLIN_NOISE];
            blendLogic = processShaderForLayer(blendDef.code, 'Blend');
            blendDeps = blendDef.deps || [];
        } else {
            blendLogic = `float getPatternBlend(vec2 uv) { return 0.0; }`;
        }
        
        const allDeps = Array.from(new Set([...mainDeps, ...blendDeps]));
        const dependencies = getRequiredChunks(allDeps);
        
        let defines = '';
        if (state.blending.enabled) defines += '#define USE_BLEND\n';
        if (state.postProcess.bloom) defines += '#define USE_BLOOM\n';
        if (state.postProcess.blur) defines += '#define USE_BLUR\n';
        if (state.normalMap.enabled) defines += '#define USE_NORMAL_MAP\n';
        if (state.ao.enabled) defines += '#define USE_AO\n';
        if (state.imageAlpha.maskEnabled) defines += '#define USE_MASK\n';
        if (state.baseTexture?.enabled) defines += '#define USE_BASE_TEX\n';
        if (state.environment.holographic) defines += '#define USE_HOLO\n';
        if (state.sticker?.enabled && state.sticker?.texture) defines += '#define USE_STICKER\n';
        
        // Force high precision if supported to prevent noise artifacts
        defines += '#ifdef GL_FRAGMENT_PRECISION_HIGH\n precision highp float;\n #else\n precision mediump float;\n #endif\n';

        return `
          ${defines}
          ${SHADER_CHUNKS.HEADER}
          ${SHADER_CHUNKS.MATH_UTILS}
          ${dependencies}
          ${mainLogic}
          ${blendLogic}
          ${SHADER_CHUNKS.MAIN_PROCESS}
        `;
    } catch (e) {
        console.error("Shader Generation Error:", e);
        return FALLBACK_SHADER;
    }
};

export const getFragmentShader = (state: AppState): string => {
    return getFragmentShaderForParams(state);
};

export const createTextureMaterial = (
  state: AppState, 
  uniforms: { [uniform: string]: THREE.IUniform }
): THREE.ShaderMaterial => {
  return new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: getFragmentShader(state),
    uniforms: uniforms,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: true,
    depthTest: true,
    fog: false,
    glslVersion: THREE.GLSL3,
  });
};
