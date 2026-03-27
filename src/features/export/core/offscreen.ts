import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { AppState, ViewMode } from '../../../core/types/types';
import { createTextureMaterial } from '../../../lib/glsl/shaderBuilder';
import { createUniformsFromState } from '../../../lib/three/uniforms';
import { disposeRoot } from '../../../lib/three/cleanup';
import { createTslMaterial } from '../../../lib/tsl/tslBuilder';
import { updateTslUniforms } from '../../../lib/tsl/uniforms';

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

let sharedLegacyRenderer: THREE.WebGLRenderer | null = null;
let sharedTslRenderer: WebGPURenderer | null = null;

const needsLegacyExport = (state: AppState): boolean => {
    const hasMaskTexture = state.imageAlpha.maskEnabled && !!state.imageAlpha.maskTexture;
    const hasBaseTexture = !!(state.baseTexture?.enabled && state.baseTexture.texture);
    const hasStickerTexture = !!(state.sticker?.enabled && state.sticker.texture);

    return hasMaskTexture || hasBaseTexture || hasStickerTexture;
};

const getSharedLegacyRenderer = (antialias: boolean): THREE.WebGLRenderer => {
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

const getSharedTslRenderer = async (antialias: boolean): Promise<WebGPURenderer> => {
    if (!sharedTslRenderer) {
        const canvas = document.createElement('canvas');
        const renderer = new WebGPURenderer({
            canvas,
            antialias,
            alpha: true,
            powerPreference: 'high-performance',
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
    const usingTsl = !needsLegacyExport(state);
    const renderer = usingTsl
        ? await getSharedTslRenderer(state.settings.antialias)
        : getSharedLegacyRenderer(state.settings.antialias);

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

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const resources: Array<{ dispose?: () => void }> = [];

    if (usingTsl) {
        const { material, uniforms } = createTslMaterial(state);
        updateTslUniforms(uniforms, state);
        (uniforms.u_resolution.value as THREE.Vector2).set(width, height);
        uniforms.u_viewMode.value = viewMode;

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
                resources.forEach(resource => resource.dispose?.());
            },
            usingTsl: true,
        };
    }

    const promises: Promise<void>[] = [];
    let maskTexture: THREE.Texture | null = null;
    let baseTexture: THREE.Texture | null = null;
    let stickerTexture: THREE.Texture | null = null;

    if (state.imageAlpha.maskEnabled && state.imageAlpha.maskTexture) {
        promises.push(new THREE.TextureLoader().loadAsync(state.imageAlpha.maskTexture).then(texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            maskTexture = texture;
            resources.push(texture);
        }));
    }

    if (state.baseTexture?.enabled && state.baseTexture.texture) {
        promises.push(new THREE.TextureLoader().loadAsync(state.baseTexture.texture).then(texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            baseTexture = texture;
            resources.push(texture);
        }));
    }

    if (state.sticker?.enabled && state.sticker.texture) {
        promises.push(new THREE.TextureLoader().loadAsync(state.sticker.texture).then(texture => {
            texture.colorSpace = THREE.SRGBColorSpace;
            stickerTexture = texture;
            resources.push(texture);
        }));
    }

    await Promise.all(promises);

    const uniforms = createUniformsFromState(state, maskTexture, baseTexture, stickerTexture);
    uniforms.u_resolution.value.set(width, height);
    uniforms.u_viewMode.value = viewMode;

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
            resources.forEach(resource => resource.dispose?.());
        },
        usingTsl: false,
    };
};
