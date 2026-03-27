import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration, Scanline, Pixelation, Glitch, Outline, TiltShift, DotScreen } from '@react-three/postprocessing';
import { BlendFunction, GlitchMode } from 'postprocessing';
import { useThree } from '@react-three/fiber';
import { AppState } from '../../../core/types/types';
import * as THREE from 'three';

export const SceneEffects: React.FC<{ appState: AppState }> = ({ appState }) => {
    const { gl } = useThree();
    const env = appState.environment;

    const hasAnySceneEffect = (
        env.sceneBloom || env.sceneScanlines || env.scenePixelate || env.sceneGlitch ||
        env.sceneChromatic || env.sceneNoise || env.sceneVignette || env.sceneOutline ||
        env.sceneTiltShift || env.sceneAscii || env.sceneDither || env.sceneRuttEtra
    );

    const supportsPostprocessing = React.useMemo(() => {
        try {
            if ((gl as { isWebGPURenderer?: boolean })?.isWebGPURenderer) {
                return false;
            }
            const context = (gl as { getContext?: () => unknown })?.getContext?.() as { getContextAttributes?: () => unknown } | undefined;
            return typeof context?.getContextAttributes === 'function';
        } catch {
            return false;
        }
    }, [gl]);

    if (!hasAnySceneEffect || !supportsPostprocessing) {
        return null;
    }

    const effectsKey = [
        env.sceneBloom, env.sceneScanlines, env.scenePixelate, env.sceneGlitch,
        env.sceneChromatic, env.sceneNoise, env.sceneVignette, env.sceneOutline,
        env.sceneTiltShift, env.sceneAscii, env.sceneDither, env.sceneRuttEtra
    ].map(e => e ? '1' : '0').join('');

    return (
        <EffectComposer key={effectsKey} enableNormalPass={false} multisampling={0} renderPriority={1} autoClear={false}>
            {([
                env.sceneOutline ? <Outline key="outline" blur edgeStrength={2.5} width={1000} visibleEdgeColor={0xffffff} hiddenEdgeColor={0x22090d} /> : null,
                env.sceneBloom ? <Bloom key="bloom" luminanceThreshold={Math.max(0.8, env.sceneBloomThreshold)} luminanceSmoothing={env.sceneBloomSmoothing} mipmapBlur intensity={env.sceneBloomIntensity} radius={env.sceneBloomRadius} /> : null,
                env.sceneTiltShift ? <TiltShift key="tilt" blur={env.sceneTiltShiftBlur} taper={0.5} focusArea={env.sceneTiltShiftFocus} /> : null,
                env.sceneChromatic ? <ChromaticAberration key="chroma" offset={[env.sceneChromaticOffset, env.sceneChromaticOffset]} radialModulation={env.sceneChromaticRadial} modulationOffset={0.5} /> : null,
                env.sceneGlitch ? <Glitch key="glitch" delay={new THREE.Vector2(env.sceneGlitchDelay, env.sceneGlitchDelay + 2.0)} duration={new THREE.Vector2(env.sceneGlitchDuration, env.sceneGlitchDuration + 0.4)} strength={new THREE.Vector2(env.sceneGlitchStrength * 0.3, env.sceneGlitchStrength)} mode={GlitchMode.CONSTANT_MILD} active ratio={0.85} /> : null,
                env.sceneAscii ? <DotScreen key="ascii" angle={Math.PI * 0.25} scale={1.0} /> : null,
                env.sceneDither ? <DotScreen key="dither" angle={0} scale={0.5} /> : null,
                env.sceneRuttEtra ? <Scanline key="rutt" density={0.8} opacity={0.5} scrollSpeed={0.05} /> : null,
                (env.sceneScanlines && !env.sceneRuttEtra) ? <Scanline key="scanline" density={1.5} opacity={0.3} /> : null,
                env.scenePixelate ? <Pixelation key="pixel" granularity={6} /> : null,
                env.sceneNoise ? <Noise key="noise" opacity={env.sceneNoiseOpacity} blendFunction={BlendFunction.OVERLAY} /> : null,
                env.sceneVignette ? <Vignette key="vignette" offset={env.sceneVignetteOffset} darkness={env.sceneVignetteDarkness} eskil={false} /> : null
            ].filter(Boolean) as any)}
        </EffectComposer>
    );
};
