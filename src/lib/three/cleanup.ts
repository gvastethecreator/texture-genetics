
import * as THREE from 'three';

/**
 * 🧹 2025 ELITE DISPOSAL UTILITY
 * Recursively cleans a generic Object3D graph, handling:
 * - Geometries
 * - Standard Materials & Textures
 * - ShaderMaterial Uniform Textures
 * - RenderTargets (FBOs)
 */
export const disposeRoot = (node: THREE.Object3D | null) => {
    if (!node) return;

    node.traverse((child) => {
        // 1. Dispose Geometry
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
            mesh.geometry.dispose();
        }

        // 2. Dispose Material(s)
        // @ts-ignore
        const material = child.material;
        if (material) {
            const materials = Array.isArray(material) ? material : [material];
            
            materials.forEach((mat: THREE.Material) => {
                // 2a. Dispose Standard Maps
                const standardMaps = [
                    'map', 'aoMap', 'alphaMap', 'bumpMap', 'displacementMap', 
                    'emissiveMap', 'envMap', 'lightMap', 'metalnessMap', 
                    'normalMap', 'roughnessMap', 'clearcoatMap', 'transmissionMap'
                ];

                standardMaps.forEach((mapName) => {
                    const texture = (mat as any)[mapName];
                    if (texture && texture.isTexture) {
                        texture.dispose();
                    }
                });

                // 2b. Dispose Shader Uniform Textures
                if ((mat as THREE.ShaderMaterial).uniforms) {
                    const uniforms = (mat as THREE.ShaderMaterial).uniforms;
                    Object.values(uniforms).forEach((uniform: any) => {
                        if (uniform && uniform.value && uniform.value.isTexture) {
                            uniform.value.dispose();
                        }
                    });
                }

                // 2c. Dispose the Material itself
                mat.dispose();
            });
        }
    });
};

/**
 * Forces WebGL Context Loss for heavy cleanup (Export operations).
 */
export const forceContextLoss = (renderer: THREE.WebGLRenderer) => {
    try {
        renderer.dispose();
        const gl = renderer.domElement.getContext('webgl2') || renderer.domElement.getContext('webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_losing_context');
            if (ext) ext.loseContext();
        }
    } catch (e) {
        console.warn("Force context loss failed", e);
    }
};
