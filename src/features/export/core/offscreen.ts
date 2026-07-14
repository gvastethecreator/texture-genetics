import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";
import { AppState, ViewMode } from "../../../core/types/types";
import { disposeRoot } from "../../../lib/three/cleanup";
import { createTslMaterial } from "../../../lib/tsl/tslBuilder";
import { updateTslUniforms } from "../../../lib/tsl/uniforms";
import { createLegacyOffscreenScene, getSharedLegacyRenderer } from "../legacy/offscreenLegacy";
import { loadRequiredExportTextures } from "./exportAssets";

type OffscreenRenderer = THREE.WebGLRenderer | WebGPURenderer;

export interface OffscreenSceneSetup {
  renderer: OffscreenRenderer;
  scene: THREE.Scene;
  camera: THREE.OrthographicCamera;
  setTime: (time: number) => void;
  setViewMode: (viewMode: ViewMode) => void;
  cleanup: () => void;
  usingTsl: boolean;
}

let sharedTslRenderer: WebGPURenderer | null = null;

export const disposeSharedTslRenderer = () => {
  if (sharedTslRenderer) {
    sharedTslRenderer.dispose();
    sharedTslRenderer = null;
  }
};

const getSharedTslRenderer = async (antialias: boolean): Promise<WebGPURenderer> => {
  if (!sharedTslRenderer) {
    const canvas = document.createElement("canvas");
    const renderer = new WebGPURenderer({
      canvas,
      antialias,
      alpha: true,
      powerPreference: "high-performance",
      forceWebGL: false,
    });

    await renderer.init();
    renderer.setPixelRatio(1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    sharedTslRenderer = renderer;
  }

  return sharedTslRenderer;
};

export const setupOffscreenScene = async (
  state: AppState,
  width: number,
  height: number,
  viewMode: ViewMode,
): Promise<OffscreenSceneSetup> => {
  let usingTsl = true;
  let renderer: OffscreenRenderer;

  try {
    renderer = await getSharedTslRenderer(state.settings.antialias);
  } catch (error) {
    console.warn("WebGPU offscreen unavailable, falling back to legacy WebGL export", error);
    usingTsl = false;
    renderer = getSharedLegacyRenderer(state.settings.antialias);
  }

  const currentSize = new THREE.Vector2();
  renderer.getSize(currentSize);
  if (currentSize.x !== width || currentSize.y !== height) {
    renderer.setSize(width, height, false);
  }

  if (viewMode === ViewMode.RENDER) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = state.environment.exposure || 1.0;
  } else {
    renderer.toneMapping = THREE.NoToneMapping;
  }

  const { maskTexture, baseTexture, stickerTexture, resources } =
    await loadRequiredExportTextures(state);

  if (usingTsl) {
    const { material, uniforms } = createTslMaterial(state, {
      maskTexture,
      baseTexture,
      stickerTexture,
    });
    updateTslUniforms(uniforms, state);
    (uniforms.u_resolution.value as THREE.Vector2).set(width, height);
    uniforms.u_viewMode.value = viewMode;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    return {
      renderer,
      scene,
      camera,
      setTime: (time) => {
        uniforms.u_time.value = time;
      },
      setViewMode: (mode) => {
        uniforms.u_viewMode.value = mode;
      },
      cleanup: () => {
        disposeRoot(scene);
        resources.forEach((resource) => resource.dispose?.());
      },
      usingTsl: true,
    };
  }

  return createLegacyOffscreenScene({
    state,
    width,
    height,
    viewMode,
    renderer: renderer as THREE.WebGLRenderer,
    maskTexture,
    baseTexture,
    stickerTexture,
    resources,
  });
};
