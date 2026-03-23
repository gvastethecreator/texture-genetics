
import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, Scanline, Pixelation, Glitch, Outline, TiltShift, DotScreen } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { AppState } from '../../../core/types/types';
import * as THREE from 'three';

export const SceneEffects: React.FC<{ appState: AppState }> = ({ appState }) => {
    const env = appState.environment;

    // Create a unique key based on active effects to force EffectComposer to rebuild
    const effectsKey = [
        env.sceneBloom,
        env.sceneScanlines,
        env.scenePixelate,
        env.sceneGlitch,
        env.sceneChromatic,
        env.sceneNoise,
        env.sceneVignette,
        env.sceneOutline,
        env.sceneTiltShift,
        env.sceneAscii,
        env.sceneDither,
        env.sceneRuttEtra
    ].map(e => e ? '1' : '0').join('');

    return (
        <EffectComposer key={effectsKey} disableNormalPass multisampling={0} renderPriority={1} autoClear={false}>
            {/* 1. GEOMETRY / EDGE FX */}
            {env.sceneOutline && (
                <Outline
                    blur
                    edgeStrength={2.5}
                    width={1000}
                    visibleEdgeColor={0xffffff}
                    hiddenEdgeColor={0x22090d}
                />
            )}

            {/* 2. COLOR & LIGHTING */}
            {env.sceneBloom && (
                <Bloom
                    luminanceThreshold={Math.max(0.8, env.sceneBloomThreshold)} // Forced high threshold to prevent washout
                    luminanceSmoothing={env.sceneBloomSmoothing}
                    mipmapBlur
                    intensity={env.sceneBloomIntensity}
                    radius={env.sceneBloomRadius}
                />
            )}

            {/* 3. LENS FX */}
            {env.sceneTiltShift && (
                <TiltShift
                    blur={env.sceneTiltShiftBlur}
                    taper={0.5}
                    focusArea={env.sceneTiltShiftFocus}
                />
            )}

            {env.sceneChromatic && (
                <ChromaticAberration
                    offset={[env.sceneChromaticOffset, env.sceneChromaticOffset]}
                    radialModulation={env.sceneChromaticRadial}
                    modulationOffset={0.5}
                />
            )}

            {env.sceneGlitch && (
                <Glitch
                    delay={new THREE.Vector2(env.sceneGlitchDelay, env.sceneGlitchDelay + 2.0)}
                    duration={new THREE.Vector2(env.sceneGlitchDuration, env.sceneGlitchDuration + 0.4)}
                    strength={new THREE.Vector2(env.sceneGlitchStrength * 0.3, env.sceneGlitchStrength)}
                    mode={GlitchMode.CONSTANT_MILD}
                    active
                    ratio={0.85}
                />
            )}

            {/* 4. RETRO / STYLIZED FX (Applied LAST for correct look) */}

            {/* ASCII */}
            {env.sceneAscii && (
                <DotScreen
                    angle={Math.PI * 0.25}
                    scale={1.0}
                />
            )}

            {/* DITHERING */}
            {env.sceneDither && (
                <DotScreen
                    angle={0}
                    scale={0.5}
                />
            )}

            {/* RUTT-ETRA */}
            {env.sceneRuttEtra && (
                <Scanline
                    density={0.8}
                    opacity={0.5}
                    scrollSpeed={0.05}
                />
            )}

            {/* REALISTIC CRT */}
            {env.sceneScanlines && !env.sceneRuttEtra && (
                <Scanline
                    density={1.5}
                    opacity={0.3}
                />
            )}

            {/* PIXELATION - Must be late in stack to pixelate the bloom/blur properly */}
            {env.scenePixelate && (
                <Pixelation
                    granularity={6} // Fixed standard granularity for scene preview
                />
            )}

            {env.sceneNoise && (
                <Noise
                    opacity={env.sceneNoiseOpacity}
                    blendFunction={BlendFunction.OVERLAY}
                />
            )}

            {env.sceneVignette && (
                <Vignette
                    offset={env.sceneVignetteOffset}
                    darkness={env.sceneVignetteDarkness}
                    eskil={false}
                />
            )}
        </EffectComposer>
    );
};
