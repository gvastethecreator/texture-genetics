import { AppState, ShaderParams } from '../../../core/types/types';
import { getFragmentShader, VERTEX_SHADER } from '../../../lib/glsl/shaderBuilder';

type DynamicShaderParamKey = Extract<keyof ShaderParams, `p${number}`>;

/**
 * Legacy standalone HTML export using GLSL/WebGL2.
 * Kept intentionally as a compatibility fallback while the app runtime is fully TSL-first.
 */
export const generateLegacyStandaloneHtml = (state: AppState): string => {
    const frag = getFragmentShader(state);
    const antialias = state.settings.antialias;

    const palette = state.params.palette || [];
    const activeColors = palette.filter((p) => p.enabled);
    if (activeColors.length === 0) {
        activeColors.push({ color: '#ffffff', enabled: true });
        activeColors.push({ color: '#000000', enabled: true });
    }

    const paletteColorsJS = activeColors.map((c) => `new THREE.Color("${c.color}")`).join(',');
    const fillerCount = 8 - activeColors.length;
    const fillerJS = fillerCount > 0 ? ',' + Array.from({ length: fillerCount }, () => 'new THREE.Color(0x000000)').join(',') : '';
    const fullPaletteArray = `[${paletteColorsJS}${fillerJS}]`;

    let paramsJS = '';
    for (let i = 1; i <= 15; i++) {
        const key = `p${i}` as DynamicShaderParamKey;
        paramsJS += `u_p${i}:{value:${state.params[key] ?? 0}},\n        `;
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>EffectTextureGen Legacy Export</title><style>body{margin:0;overflow:hidden;background:#000;}</style></head><body><script type="importmap">{"imports": {"three": "https://unpkg.com/three@0.183.2/build/three.module.js"}}</script><script type="module">
    import * as THREE from 'three';

    const scene=new THREE.Scene();
    const camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: ${antialias} });

    if (!context) {
        document.body.innerHTML = "<div style='color:red;padding:20px;'>Error: WebGL 2 not supported by this browser.</div>";
        throw new Error("WebGL 2 Required");
    }

    const renderer=new THREE.WebGLRenderer({ canvas: canvas, context: context, alpha:true, antialias:${antialias} });

    renderer.setSize(window.innerWidth,window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    const uniforms={
        u_time:{value:0},
        u_resolution:{value:new THREE.Vector2(window.innerWidth,window.innerHeight)},
        u_viewMode:{value:${state.viewMode}},
        u_scale:{value:${Math.max(0.001, state.params.scale)}},
        u_intensity:{value:${state.params.intensity}},
        u_factor:{value:${state.params.factor}},
        u_speed:{value:${state.params.speed}},
        u_distortion:{value:${state.params.distortion}},
        u_detail:{value:${state.params.detail}},
        u_seed:{value:${state.params.seed}},
        u_paletteCount:{value:${activeColors.length}},
        u_palette:{value:${fullPaletteArray}},
        u_color1:{value:new THREE.Color("${state.params.color1}")},
        u_color2:{value:new THREE.Color("${state.params.color2}")},
        ${paramsJS}
        u_blendEnabled:{value:${state.blending.enabled}},
        u_blendMode:{value:${state.blending.mode}},
        u_blendOpacity:{value:${state.blending.opacity}},
        u_blendScale:{value:${Math.max(0.001, state.blending.scale)}},
        u_blendFactor:{value:${state.blending.factor}},
        u_blendIntensity:{value:${state.blending.intensity}},
        u_blendDetail:{value:${state.blending.factor}},
        u_blendSeed:{value:${state.params.seed + 100.0}},
        u_angle:{value:${state.transform.angle * (Math.PI / 180)}},
        u_offset:{value:new THREE.Vector2(${state.transform.offsetX},${state.transform.offsetY})},
        u_symEnabled:{value:${state.symmetry.enabled}},
        u_symSegments:{value:${state.symmetry.segments}},
        u_symRotation:{value:${state.symmetry.rotation * (Math.PI / 180)}},
        u_symZoom:{value:${state.symmetry.zoom}},
        u_tilingEnabled:{value:${state.tiling.enabled}},
        u_tilingMirror:{value:${state.tiling.mirror}},
        u_tilingRepeat:{value:new THREE.Vector2(${state.tiling.repeatX},${state.tiling.repeatY})},
        u_tilingOffset:{value:new THREE.Vector2(${state.tiling.offsetX},${state.tiling.offsetY})},
        u_tilingRotation:{value:${state.tiling.rotation * (Math.PI / 180)}},
        u_tilingScale:{value:${Math.max(0.01, state.tiling.scale)}},
        u_applyToMap:{value:true},
        u_polar:{value:${state.postProcess.polar}},
        u_toon:{value:${state.postProcess.toon}},
        u_toonLevels:{value:${state.postProcess.toonLevels}},
        u_posterize:{value:${state.postProcess.posterize}},
        u_posterizeLevels:{value:${state.postProcess.posterizeLevels}},
        u_chromaticAberration:{value:${state.postProcess.chromaticAberration}},
        u_radialMask:{value:${state.postProcess.radialMask}},
        u_vignette:{value:${state.postProcess.vignette}},
        u_bloomEnabled:{value:${state.postProcess.bloom}},
        u_bloomThreshold:{value:${state.postProcess.bloomThreshold}},
        u_bloomStrength:{value:${state.postProcess.bloomStrength}},
        u_blurEnabled:{value:${state.postProcess.blur}},
        u_blurStrength:{value:${state.postProcess.blurStrength}},
        u_normalize:{value:${state.postProcess.normalize}},
        u_glitch:{value:${state.postProcess.glitch}},
        u_glitchStrength:{value:${state.postProcess.glitchStrength}},
        u_glitchSpeed:{value:${state.postProcess.glitchSpeed}},
        u_pixelate:{value:${state.postProcess.pixelate}},
        u_pixelDensity:{value:${state.postProcess.pixelDensity}},
        u_scanlines:{value:${state.postProcess.scanlines}},
        u_scanlineIntensity:{value:${state.postProcess.scanlineIntensity}},
        u_crtDistortion:{value:${state.postProcess.crtDistortion}},
        u_normalEnabled:{value:${state.normalMap.enabled}},
        u_normalStrength:{value:${state.normalMap.strength}},
        u_normalInvert:{value:${state.normalMap.invert}},
        u_normalSmoothness:{value:${state.normalMap.smoothness}},
        u_dispStrength:{value:${state.displacement.strength}},
        u_dispBias:{value:${state.displacement.bias}},
        u_aoEnabled:{value:${state.ao.enabled}},
        u_aoStrength:{value:${state.ao.strength}},
        u_aoRadius:{value:${state.ao.radius}},
        u_shadows:{value:new THREE.Vector3(${state.colorBalance.shadows.r},${state.colorBalance.shadows.g},${state.colorBalance.shadows.b})},
        u_midtones:{value:new THREE.Vector3(${state.colorBalance.midtones.r},${state.colorBalance.midtones.g},${state.colorBalance.midtones.b})},
        u_highlights:{value:new THREE.Vector3(${state.colorBalance.highlights.r},${state.colorBalance.highlights.g},${state.colorBalance.highlights.b})},
        u_brightness:{value:${state.colorBalance.brightness}},
        u_contrast:{value:${state.colorBalance.contrast}},
        u_saturation:{value:${state.colorBalance.saturation}},
        u_hue:{value:${state.colorBalance.hue}},
        u_cycleSpeed:{value:${state.colorBalance.cycleSpeed}},
        u_alphaEnabled:{value:${state.imageAlpha.enabled}},
        u_alphaThreshold:{value:${state.imageAlpha.threshold}},
        u_alphaTolerance:{value:${state.imageAlpha.tolerance}},
        u_alphaBlur:{value:${state.imageAlpha.blur}},
        u_maskEnabled:{value:false},
        u_maskTexture:{value:null},
        u_stickerEnabled:{value:false},
        u_stickerTexture:{value:null},
        u_stickerOpacity:{value:1.0},
        u_stickerBlendMode:{value:0},
        u_stickerPos:{value:new THREE.Vector2(0,0)},
        u_stickerScale:{value:1.0},
        u_stickerRot:{value:0},
        u_stickerColor:{value:new THREE.Color(1,1,1)},
        u_stickerUseColor:{value:false},
        u_baseEnabled:{value:false},
        u_baseTexture:{value:null},
        u_baseOpacity:{value:1.0},
        u_baseBlendMode:{value:0},
        u_baseEffect:{value:0},
        u_baseEffectStrength:{value:0.5},
        u_mouse:{value:new THREE.Vector2(0,0)},
        u_mouseEnabled:{value:false},
        u_mouseType:{value:0},
        u_mouseStrength:{value:0.0},
        u_mouseRadius:{value:0.1},
        u_lightDir:{value:new THREE.Vector3(${state.environment.lightX},${state.environment.lightY},1.0)},
        u_lightIntensity:{value:${state.environment.lightIntensity}},
        u_roughness:{value:${state.environment.roughness}},
        u_metalness:{value:${state.environment.metalness}},
        u_envType:{value:${state.environment.envType}},
        u_holographic:{value:${state.environment.holographic}},
        u_holoStrength:{value:${state.environment.holoStrength}},
        u_fogEnabled:{value:false},
        u_fogDensity:{value:0},
        u_fogColor:{value:new THREE.Color(0,0,0)},
        u_isUVDebug:{value:false}
    };

    const material=new THREE.ShaderMaterial({
        uniforms:uniforms,
        vertexShader:\`${VERTEX_SHADER}\`,
        fragmentShader:\`${frag}\`,
        transparent:true,
        glslVersion: THREE.GLSL3
    });

    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
    scene.add(mesh);

    function animate(){
        requestAnimationFrame(animate);
        uniforms.u_time.value+=0.01*${state.params.speed};
        renderer.render(scene,camera);
    }
    animate();

    window.addEventListener('resize',()=>{
        renderer.setSize(window.innerWidth,window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth,window.innerHeight);
    });
    </script></body></html>`;
};
