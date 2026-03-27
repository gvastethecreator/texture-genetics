
import React, { memo, useEffect } from 'react';
import { Environment } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState } from '../../../core/types/types';
import { InfiniteGrid } from './InfiniteGrid';

interface SceneLightingProps {
    appState: AppState;
}

const ENV_PRESETS = ['studio', 'sunset', 'night', 'dawn'] as const;

export const SceneLighting: React.FC<SceneLightingProps> = memo(({ appState }) => {
    const { gl } = useThree();
    const { lightIntensity, lightX, lightY, envType, envBackground, lightColor, ambientColor, exposure } = appState.environment;
    const { gridOverlay } = appState;

    // Apply Exposure
    useEffect(() => {
        // Safe check in case renderer isn't ready
        if (gl) {
            gl.toneMappingExposure = exposure || 1.0;
        }
    }, [gl, exposure]);

    // Map numeric envType to string preset for Drei
    const preset = ENV_PRESETS[envType % ENV_PRESETS.length] || 'studio';

    const supportsWebGlOnlyDrei = React.useMemo(() => {
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

    return (
        <>
            {/* HDRI Environment (WebGL-only via drei) */}
            {supportsWebGlOnlyDrei && <Environment preset={preset} background={envBackground} blur={0.5} />}

            {/* Professional Infinite Grid */}
            {supportsWebGlOnlyDrei && gridOverlay && <InfiniteGrid />}

            {/* Dynamic Key Light */}
            <directionalLight
                position={[lightX * 10, lightY * 10, 5]}
                intensity={lightIntensity * 2.0}
                color={lightColor}
                castShadow
                shadow-bias={-0.0005} // Prevent shadow acne
                shadow-mapSize={[2048, 2048]} // High quality shadows
            >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
            </directionalLight>

            {/* Fill Light (Softer) - REDUCED from 0.5 to 0.3 */}
            <directionalLight
                position={[-5, 0, 5]}
                intensity={lightIntensity * 0.3}
                color="#dbeafe"
            />

            {/* Base Ambient - DRASTICALLY REDUCED from 0.2 to 0.05 to prevent Bloom blowout */}
            <ambientLight intensity={0.05} color={ambientColor} />
        </>
    );
});
