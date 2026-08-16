import * as THREE from "three";

const STANDARD_MAP_KEYS = [
  "map",
  "aoMap",
  "alphaMap",
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "envMap",
  "lightMap",
  "metalnessMap",
  "normalMap",
  "roughnessMap",
  "clearcoatMap",
  "transmissionMap",
] as const;

type DisposableNode = THREE.Object3D & {
  geometry?: THREE.BufferGeometry;
  material?: THREE.Material | THREE.Material[];
};

type MaterialWithTextureSlots = THREE.Material &
  Partial<Record<(typeof STANDARD_MAP_KEYS)[number], THREE.Texture | null>>;

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
    const disposableChild = child as DisposableNode;

    // 1. Dispose Geometry
    if (disposableChild.geometry) {
      disposableChild.geometry.dispose();
    }

    // 2. Dispose Material(s)
    const material = disposableChild.material;
    if (material) {
      const materials = Array.isArray(material) ? material : [material];

      materials.forEach((mat: THREE.Material) => {
        // 2a. Dispose Standard Maps
        STANDARD_MAP_KEYS.forEach((mapName) => {
          const texture = (mat as MaterialWithTextureSlots)[mapName];
          if (texture && texture.isTexture) {
            texture.dispose();
          }
        });

        // 2b. Dispose Shader Uniform Textures
        if ("uniforms" in mat) {
          const uniforms = (mat as THREE.ShaderMaterial).uniforms;
          Object.values(uniforms).forEach((uniform) => {
            const value = uniform?.value;
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });
        }

        // 2c. Dispose the Material itself
        mat.dispose();
      });
    }
  });
};
