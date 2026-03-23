import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { AppState, ViewMode, GeometryType } from '../../../core/types/types';
import { setupOffscreenScene } from '../core/offscreen';

export const generateGlb = async (state: AppState, onProgress: (p: number) => void): Promise<Blob> => {
    onProgress(10);
    
    // 1. Generate Texture
    const res = Math.min(state.resolution, 2048);
    const { renderer, scene, camera, material, cleanup } = await setupOffscreenScene(state, res, res, ViewMode.RENDER);
    
    material.uniforms.u_time.value = state.time;
    renderer.render(scene, camera);
    
    onProgress(40);
    
    const canvas = renderer.domElement;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    
    // 2. Create Geometry and Material
    const exportScene = new THREE.Scene();
    
    let geometry: THREE.BufferGeometry;
    
    // Simple mapping for basic geometries. For CUSTOM/SVG/TEXT, we'd need the actual geometry reference,
    // but for now we'll fall back to a plane if it's complex, or try to recreate basic ones.
    switch (state.geometry) {
        case GeometryType.CUBE: geometry = new THREE.BoxGeometry(2, 2, 2); break;
        case GeometryType.SPHERE: geometry = new THREE.SphereGeometry(1.5, 64, 64); break;
        case GeometryType.CYLINDER: geometry = new THREE.CylinderGeometry(1, 1, 2, 64); break;
        case GeometryType.CARD: geometry = new THREE.BoxGeometry(2, 3, 0.05); break;
        default: geometry = new THREE.PlaneGeometry(2, 2); break;
    }
    
    const exportMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: state.imageAlpha.enabled,
        side: THREE.DoubleSide,
        roughness: state.environment.roughness,
        metalness: state.environment.metalness
    });
    
    const mesh = new THREE.Mesh(geometry, exportMaterial);
    exportScene.add(mesh);
    
    onProgress(70);
    
    // 3. Export GLB
    return new Promise((resolve, reject) => {
        const exporter = new GLTFExporter();
        exporter.parse(
            exportScene,
            (gltf) => {
                cleanup();
                onProgress(100);
                resolve(new Blob([gltf as ArrayBuffer], { type: 'model/gltf-binary' }));
            },
            (error) => {
                cleanup();
                reject(error);
            },
            { binary: true }
        );
    });
};
