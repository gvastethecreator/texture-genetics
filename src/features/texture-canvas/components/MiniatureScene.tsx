
import React, { useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AppState, ViewMode } from '../../../core/types/types';
import { createUniformsFromState, updateUniformsFromState } from '../../../lib/three/uniforms';
import { getFragmentShaderForParams, VERTEX_SHADER } from '../../../lib/glsl/shaderBuilder';
import { useTextureResource } from '../../../shared/hooks/useTextureResource';

export const MiniatureScene: React.FC<{ appState: AppState; size: number }> = memo(({ appState, size }) => {
    const maskTex = useTextureResource(appState.imageAlpha.maskEnabled ? appState.imageAlpha.maskTexture : null);
    const baseTex = useTextureResource(appState.baseTexture?.enabled ? appState.baseTexture.texture : null);
    const stickerTex = useTextureResource(appState.sticker?.enabled ? appState.sticker.texture : null);

    const material = useMemo(() => {
        const uniforms = createUniformsFromState(appState, maskTex, baseTex, stickerTex);
        uniforms.u_viewMode.value = ViewMode.ALBEDO; 
        uniforms.u_applyToMap.value = true;
        
        const frag = getFragmentShaderForParams(appState);
        
        const mat = new THREE.ShaderMaterial({
            vertexShader: VERTEX_SHADER,
            fragmentShader: frag,
            uniforms: uniforms,
            transparent: false,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false,
            fog: false,
            glslVersion: THREE.GLSL3, // UPGRADE: Explicit WebGL 2.0
        });
        return mat;
    }, [
        appState.textureType, 
        appState.blending.enabled, 
        appState.blending.type, 
        maskTex, baseTex, stickerTex
    ]);

    useEffect(() => {
        return () => { material.dispose(); };
    }, [material]);

    // Update Uniforms when State changes (Event Driven)
    useEffect(() => {
        if (material) {
            updateUniformsFromState(material.uniforms, appState, maskTex, baseTex, stickerTex);
            
            // Re-apply overrides specific to Miniature
            // This ensures the mini-map always shows the raw pattern even if main view is Render/Normal
            material.uniforms.u_viewMode.value = ViewMode.ALBEDO;
            material.uniforms.u_applyToMap.value = true; 
        }
    }, [appState, maskTex, baseTex, stickerTex, material]);

    // Animation Loop (Only Time)
    useFrame((state) => {
        if (material) {
            // Resolution might change if container resizes, but miniature size is usually fixed prop
            material.uniforms.u_resolution.value.set(size, size);
            
            // Enforce Albedo each frame to fight race conditions from global uniform updates
            material.uniforms.u_viewMode.value = ViewMode.ALBEDO;
            
            if (appState.animate) {
               material.uniforms.u_time.value = state.clock.elapsedTime * appState.params.speed; 
            } else {
               material.uniforms.u_time.value = appState.time; 
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
