
import React, { useMemo, useRef, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, ViewMode } from '../../../core/types/types';
import { createTslMaterial } from '../../../lib/tsl/tslBuilder';
import { updateTslUniforms, TslUniforms } from '../../../lib/tsl/uniforms';

export const MiniatureScene: React.FC<{ appState: AppState; size: number }> = memo(({ appState, size }) => {
    const tslUniformsRef = useRef<TslUniforms | null>(null);

    const material = useMemo(() => {
        // Override viewMode to always show ALBEDO in miniature
        const miniState = { ...appState, viewMode: ViewMode.ALBEDO };
        const { material: mat, uniforms: u } = createTslMaterial(miniState);
        tslUniformsRef.current = u;
        mat.depthTest = false;
        mat.depthWrite = false;
        mat.fog = false;
        return mat;
    }, [
        appState.textureType, 
        appState.blending.enabled, 
        appState.blending.type, 
    ]);

    useEffect(() => {
        return () => { material.dispose(); };
    }, [material]);

    // Update Uniforms when State changes (Event Driven)
    useEffect(() => {
        const u = tslUniformsRef.current;
        if (u) {
            updateTslUniforms(u, appState);
            // Re-apply overrides specific to Miniature
            u.u_viewMode.value = ViewMode.ALBEDO;
            u.u_applyToMap.value = 1;
        }
    }, [appState, material]);

    // Animation Loop (Only Time)
    useFrame((state) => {
        const u = tslUniformsRef.current;
        if (u) {
            (u.u_resolution.value as THREE.Vector2).set(size, size);
            u.u_viewMode.value = ViewMode.ALBEDO;
            
            if (appState.animate) {
               u.u_time.value = state.clock.elapsedTime * appState.params.speed; 
            } else {
               u.u_time.value = appState.time; 
            }
        }
    });

    return (
        <mesh>
            <planeGeometry args={[size, size]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
});
