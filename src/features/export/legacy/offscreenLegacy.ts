import * as THREE from 'three';
import { AppState, ViewMode } from '../../../core/types/types';
import { createTextureMaterial } from '../../../lib/glsl/shaderBuilder';
import { createUniformsFromState } from '../../../lib/three/uniforms';
import { disposeRoot } from '../../../lib/three/cleanup';

export interface LegacyOffscreenSetup {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    setTime: (time: number) => void;
    setViewMode: (viewMode: ViewMode) => void;
    cleanup: () => void;
    usingTsl: false;
}

let sharedLegacyRenderer: THREE.WebGLRenderer | null = null;

export const getSharedLegacyRenderer = (antialias: boolean): THREE.WebGLRenderer => {
    if (sharedLegacyRenderer) {
        const gl = sharedLegacyRenderer.getContext();
        if (gl.isContextLost()) {
            console.warn('Shared legacy renderer context lost - recreating');
            sharedLegacyRenderer.dispose();
            sharedLegacyRenderer = null;
        }
    }

    if (!sharedLegacyRenderer) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', {
            alpha: true,
            antialias,
            preserveDrawingBuffer: true,
            powerPreference: 'high-performance',
        }) as WebGL2RenderingContext | null;

        if (!context) {
            console.error('WebGL 2 not supported, legacy export may fail with GLSL 3.0 shaders');
        }

        sharedLegacyRenderer = new THREE.WebGLRenderer({
            canvas,
            context: context ?? undefined,
            alpha: true,
            antialias,
            preserveDrawingBuffer: true,
            depth: false,
            stencil: false,
        });

        sharedLegacyRenderer.setPixelRatio(1);
        sharedLegacyRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    try {
        sharedLegacyRenderer.resetState();
    } catch (error) {
        console.warn('Shared legacy renderer reset failed, forcing recreation', error);
        sharedLegacyRenderer.dispose();
        sharedLegacyRenderer = null;
        return getSharedLegacyRenderer(antialias);
    }

    return sharedLegacyRenderer;
};

interface CreateLegacyOffscreenSceneArgs {
    state: AppState;
    width: number;
    height: number;
    viewMode: ViewMode;
    renderer: THREE.WebGLRenderer;
    maskTexture: THREE.Texture | null;
    baseTexture: THREE.Texture | null;
    stickerTexture: THREE.Texture | null;
    resources: Array<{ dispose?: () => void }>;
}

export const createLegacyOffscreenScene = ({
    state,
    width,
    height,
    viewMode,
    renderer,
    maskTexture,
    baseTexture,
    stickerTexture,
    resources,
}: CreateLegacyOffscreenSceneArgs): LegacyOffscreenSetup => {
    const uniforms = createUniformsFromState(state, maskTexture, baseTexture, stickerTexture);
    uniforms.u_resolution.value.set(width, height);
    uniforms.u_viewMode.value = viewMode;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const material = createTextureMaterial(state, uniforms);
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
        usingTsl: false,
    };
};
