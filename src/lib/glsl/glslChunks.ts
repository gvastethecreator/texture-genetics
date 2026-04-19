import { MATH_UTILS } from "./chunks/math";
import {
  BASE_NOISE,
  SIMPLEX_NOISE,
  VALUE_NOISE,
  CLASSIC_NOISE,
  FBM,
  CURL_NOISE,
  VORONOI,
  GYROID,
} from "./chunks/noise";
import { SPECTRAL_LIB, LIGHTING_FUNCTIONS } from "./chunks/lighting";
import { TRANSFORM_FUNCTIONS, PROCESS_FUNCTIONS } from "./chunks/postProcess";
import { SDF_LIB } from "./chunks/sdf";

// ROBUST GLSL 3.0 HEADER
// We use #ifndef guards to prevent collisions with Three.js built-ins
// NOTE: Do NOT add 'precision' here. Three.js auto-injects it in GLSL3 mode.
const HEADER = `
    layout(location = 0) out vec4 pc_fragColor;

    // GLSL 3.0 Compatibility Macros
    #ifndef texture2D
    #define texture2D texture
    #endif
    
    #ifndef textureCube
    #define textureCube texture
    #endif

    // Inputs from Vertex Shader
    in vec2 vUv;
    in vec3 vNormal;
    in vec3 vViewPosition;
    in vec3 vWorldPosition;

    uniform float u_time;
    uniform vec2 u_resolution;
    uniform int u_viewMode; 

    // Pattern Params
    uniform float u_scale;
    uniform float u_intensity;
    uniform float u_speed;
    uniform float u_factor;
    uniform float u_distortion;
    uniform float u_detail;
    uniform float u_seed;
    
    // Legacy support vars (mapped to palette)
    uniform vec3 u_color1; 
    uniform vec3 u_color2;
    
    // Rich Palette
    uniform vec3 u_palette[8];
    uniform int u_paletteCount;
    
    // Extra Params
    uniform float u_p1;
    uniform float u_p2;
    uniform float u_p3;
    uniform float u_p4;
    uniform float u_p5;
    uniform float u_p6;
    uniform float u_p7;
    uniform float u_p8;
    uniform float u_p9;
    uniform float u_p10;
    uniform float u_p11;
    uniform float u_p12;
    uniform float u_p13;
    uniform float u_p14;
    uniform float u_p15;
    
    // Blending
    uniform bool u_blendEnabled;
    uniform int u_blendMode;
    uniform float u_blendOpacity;
    uniform float u_blendScale;
    uniform float u_blendFactor;
    uniform float u_blendIntensity;
    uniform float u_blendDetail;
    uniform float u_blendSeed;
    
    // Base Texture
    #ifdef USE_BASE_TEX
        uniform sampler2D u_baseTexture;
    #endif
    uniform bool u_baseEnabled;
    uniform float u_baseOpacity;
    uniform int u_baseBlendMode;
    uniform int u_baseEffect;
    uniform float u_baseEffectStrength;
    
    // Sticker Layer
    #ifdef USE_STICKER
        uniform sampler2D u_stickerTexture;
    #endif
    uniform bool u_stickerEnabled;
    uniform float u_stickerOpacity;
    uniform int u_stickerBlendMode;
    uniform vec2 u_stickerPos;
    uniform float u_stickerScale;
    uniform float u_stickerRot;
    uniform vec3 u_stickerColor;
    uniform bool u_stickerUseColor;

    // Transforms
    uniform float u_angle;
    uniform vec2 u_offset;

    // Symmetry
    uniform bool u_symEnabled;
    uniform float u_symSegments;
    uniform float u_symRotation;
    uniform float u_symZoom;

    // Tiling
    uniform bool u_tilingEnabled;
    uniform bool u_tilingMirror;
    uniform vec2 u_tilingRepeat;
    uniform vec2 u_tilingOffset;
    uniform float u_tilingRotation;
    uniform float u_tilingScale;

    // Post Process
    uniform bool u_applyToMap;
    uniform bool u_polar;
    uniform bool u_toon;
    uniform float u_toonLevels;
    uniform bool u_posterize;
    uniform float u_posterizeLevels;
    uniform float u_chromaticAberration;
    uniform float u_radialMask;
    uniform float u_vignette;
    
    uniform bool u_bloomEnabled;
    uniform float u_bloomThreshold;
    uniform float u_bloomStrength;

    uniform bool u_blurEnabled;
    uniform float u_blurStrength;

    uniform bool u_normalize;
    
    uniform bool u_glitch;
    uniform float u_glitchStrength;
    uniform float u_glitchSpeed;
    
    // Retro FX
    uniform bool u_pixelate;
    uniform float u_pixelDensity;
    uniform bool u_scanlines;
    uniform float u_scanlineIntensity;
    uniform float u_crtDistortion;
    
    // NEW FX
    uniform bool u_halftone;
    uniform float u_halftoneScale;
    uniform bool u_edgeDetect;
    uniform vec3 u_edgeColor;

    // Material
    uniform bool u_normalEnabled;
    uniform float u_normalStrength;
    uniform bool u_normalInvert;
    uniform float u_normalSmoothness;
    
    uniform float u_dispStrength;
    uniform float u_dispBias;

    uniform bool u_aoEnabled;
    uniform float u_aoStrength;
    uniform float u_aoRadius;

    // Color Balance
    uniform vec3 u_shadows;
    uniform vec3 u_midtones;
    uniform vec3 u_highlights;
    uniform float u_brightness;
    uniform float u_contrast;
    uniform float u_saturation;
    uniform float u_hue;
    uniform float u_cycleSpeed;

    // Alpha & Mask
    uniform bool u_alphaEnabled;
    uniform float u_alphaThreshold;
    uniform float u_alphaTolerance;
    uniform float u_alphaBlur;
    
    #ifdef USE_MASK
        uniform sampler2D u_maskTexture;
    #endif
    uniform bool u_maskEnabled;
    
    // Mouse
    uniform vec2 u_mouse;
    uniform int u_mouseType;
    uniform float u_mouseStrength;
    uniform float u_mouseRadius;
    uniform bool u_mouseEnabled;
    
    // Environment
    uniform vec3 u_lightDir; 
    uniform float u_lightIntensity;
    uniform float u_roughness;
    uniform float u_metalness;
    uniform int u_envType;
    
    uniform bool u_holographic;
    uniform float u_holoStrength;
    
    // Manual Fog Params
    uniform bool u_fogEnabled;
    uniform float u_fogDensity;
    uniform vec3 u_fogColor;
    
    // Debug
    uniform bool u_isUVDebug;

    #define PI 3.14159265359
    #define TAU 6.28318530718
`;

const modernize = (code: string) => code;

export const SHADER_CHUNKS = {
  HEADER,
  MATH_UTILS,
  BASE_NOISE,
  SIMPLEX_NOISE,
  VALUE_NOISE,
  CLASSIC_NOISE,
  FBM,
  CURL_NOISE,
  VORONOI,
  GYROID,
  SPECTRAL_LIB,
  SDF_LIB,
  MAIN_PROCESS: `
        ${modernize(TRANSFORM_FUNCTIONS)}
        ${PROCESS_FUNCTIONS}
        ${LIGHTING_FUNCTIONS}
        
        void main() {
            vec2 st = vUv;
    
            // UV Transforms
            st = getTransformedUV(st);
            
            // Pixelation
            st = pixelateUV(st);
            
            // Glitch UV Offset
            if (u_glitch) {
                float noise = random(floor(st.y * 20.0) + floor(u_time * u_glitchSpeed * 10.0));
                if (noise > 1.0 - u_glitchStrength * 0.5) {
                    st.x += (random(u_time) - 0.5) * u_glitchStrength * 0.2;
                }
            }

            // --- PATTERN GENERATION ---
            float n = getPatternMain(st);
            n = clamp(n, 0.0, 1.0);
            
            // --- BLENDING LAYER ---
            if (u_blendEnabled) {
                float b = getPatternBlend(st);
                b = clamp(b, 0.0, 1.0);
                n = blendApply(n, b, u_blendMode);
            }
            
            // --- RICH COLOR MAPPING ---
            // Replaces old mix(color1, color2) with multi-stop gradient
            vec3 col = getPaletteColor(clamp(n, 0.0, 1.0), u_palette, u_paletteCount);
            
            // --- TOON SHADING (Pattern Level) ---
            if (u_toon) {
                float levels = max(2.0, u_toonLevels);
                col = floor(col * levels) / levels;
            }
            
            // --- BASE TEXTURE BLENDING ---
            #ifdef USE_BASE_TEX
                if (u_baseEnabled) {
                    vec2 baseUV = vUv;
                    if (u_baseEffect == 1) baseUV += vec2(n) * u_baseEffectStrength * 0.1;
                    if (u_baseEffect == 4) baseUV += sin(baseUV * 10.0 + n * 10.0) * 0.01 * u_baseEffectStrength;
                    
                    vec4 baseCol = texture(u_baseTexture, baseUV);
                    vec3 blended = applyBlendModeVec3(baseCol.rgb, col, u_baseBlendMode);
                    col = mix(baseCol.rgb, blended, u_baseOpacity);
                }
            #endif
            
            // --- STICKER LAYER ---
            #ifdef USE_STICKER
                col = applySticker(vec4(col, 1.0), vUv).rgb;
            #endif
            
            // --- LIGHTING & MATERIALS ---
            vec3 normal = vNormal; 
            
            if (u_viewMode == 1 || u_viewMode == 3) {
                #ifdef USE_NORMAL_MAP
                    vec3 procNormal = getAccurateNormal(st, n, u_normalStrength, u_normalEnabled, u_normalInvert);
                    normal = normalize(normal + procNormal * 0.5);
                #endif
            }
            
            // --- RENDER MODE ---
            if (u_viewMode == 3) {
                float ao = 1.0;
                #ifdef USE_AO
                    ao = getAO(st, n, normal, u_aoEnabled, u_aoStrength);
                #endif
                
                vec3 viewDir = normalize(vViewPosition);
                col = getLitColor(col, normal, viewDir, u_lightDir, u_roughness, u_metalness, ao, u_envType, u_lightIntensity);
                
                #ifdef USE_HOLO
                    if (u_holographic) {
                       col = getHolographicColor(col, viewDir, u_lightDir, normal, st, u_holoStrength, u_lightIntensity, u_scale); 
                    }
                #endif
                
                float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
                vec3 saturated = mix(vec3(lum), col, 1.25);
                col = mix(col, saturated, min(1.0, lum * 2.0));
                
                col = aces_tonemap(col);
            }
            
            // --- VIEW MODES ---
            if (u_viewMode == 1) {
                col = normal * 0.5 + 0.5; 
            } else if (u_viewMode == 2) {
                col = vec3(n); 
            } else if (u_viewMode == 4) {
                col = vec3(vUv, 0.0);
            }
            
            // --- POST PROCESS ---
            if (u_applyToMap || u_viewMode == 3) {
                col = applyScanlines(col, vUv);
                col = applyColorBalance(col);
                
                // NEW: Halftone
                if(u_halftone) {
                    col = applyHalftone(col, vUv, u_halftoneScale);
                }
                
                // NEW: Edge Detect
                if(u_edgeDetect) {
                    col = applyEdgeDetect(col, vUv, u_edgeColor);
                }
                
                col = applyPostProcess(col, vUv);
                
                if (u_chromaticAberration > 0.0) {
                     col.r = col.r * (1.0 + u_chromaticAberration * 0.01);
                     col.b = col.b * (1.0 - u_chromaticAberration * 0.01);
                }
            }

            // --- ALPHA MASKING ---
            float alpha = 1.0;
            if (u_alphaEnabled) {
                float luma = dot(col, vec3(0.299, 0.587, 0.114));
                float mask = smoothstep(u_alphaThreshold - u_alphaTolerance, u_alphaThreshold + u_alphaTolerance, luma);
                if (u_maskEnabled) {
                    #ifdef USE_MASK
                    float maskVal = texture(u_maskTexture, vUv).r;
                    mask *= maskVal;
                    #endif
                }
                alpha = mask;
            }
            
            pc_fragColor = vec4(clamp(col, 0.0, 1.0), alpha);
        }
    `,
};
