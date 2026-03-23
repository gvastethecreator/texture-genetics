
import * as THREE from 'three';
import { AppState, ViewMode } from '../../../core/types/types';
import { createTextureMaterial } from '../../../lib/glsl/shaderBuilder';
import { createUniformsFromState } from '../../../lib/three/uniforms';
import { disposeRoot } from '../../../lib/three/cleanup';

// Singleton Renderer to save WebGL contexts
let sharedRenderer: THREE.WebGLRenderer | null = null;

export const getSharedRenderer = (antialias: boolean): THREE.WebGLRenderer => {
    // Check for context loss
    if (sharedRenderer) {
        const gl = sharedRenderer.getContext();
        if (gl.isContextLost()) {
            console.warn("Shared Renderer Context Lost - Recreating");
            sharedRenderer.dispose();
            sharedRenderer = null;
        }
    }

    if (!sharedRenderer) {
        // Explicitly create WebGL 2 Context
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', { 
            alpha: true, 
            antialias: antialias,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
        }) as WebGL2RenderingContext;

        if (!context) {
            console.error("WebGL 2 not supported, export might fail with GLSL 3.0 shaders");
        }

        sharedRenderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            context: context,
            alpha: true, 
            antialias: antialias, 
            preserveDrawingBuffer: true,
            depth: false,
            stencil: false
        });
        
        sharedRenderer.setPixelRatio(1); // Exports are usually 1:1 pixel perfect
        sharedRenderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    
    // Safety check: Is the renderer actually usable?
    try {
        sharedRenderer.resetState();
    } catch(e) {
        console.warn("Shared Renderer state reset failed, force recreation", e);
        if(sharedRenderer) sharedRenderer.dispose();
        sharedRenderer = null;
        return getSharedRenderer(antialias); // Recursively try again once
    }

    return sharedRenderer;
};

export const setupOffscreenScene = async (
    state: AppState, 
    width: number, 
    height: number, 
    viewMode: ViewMode
) => {
    const renderer = getSharedRenderer(state.settings.antialias);
    
    // Resize
    const currentSize = new THREE.Vector2();
    renderer.getSize(currentSize);
    if (currentSize.x !== width || currentSize.y !== height) {
        renderer.setSize(width, height, false);
    }
    
    // WYSIWYG TONE MAPPING MATCHING
    // Previously inconsistent with TextureCanvas. Now enforced to ACESFilmic.
    if (viewMode === ViewMode.RENDER) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = state.environment.exposure || 1.0; // SYNC EXPOSURE
    } else {
        renderer.toneMapping = THREE.NoToneMapping;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Track resources for cleanup
    const resources: any[] = [];

    // Async Texture Loading
    const promises = [];
    let maskTexture: THREE.Texture | null = null;
    let baseTexture: THREE.Texture | null = null;
    let stickerTexture: THREE.Texture | null = null;

    if (state.imageAlpha.maskEnabled && state.imageAlpha.maskTexture) {
        promises.push(new THREE.TextureLoader().loadAsync(state.imageAlpha.maskTexture).then(t => {
            t.colorSpace = THREE.SRGBColorSpace;
            maskTexture = t;
            resources.push(t);
        }));
    }
    
    if (state.baseTexture?.enabled && state.baseTexture?.texture) {
         promises.push(new THREE.TextureLoader().loadAsync(state.baseTexture.texture).then(t => {
             t.colorSpace = THREE.SRGBColorSpace;
             baseTexture = t;
             resources.push(t);
         }));
    }

    if (state.sticker?.enabled && state.sticker?.texture) {
        promises.push(new THREE.TextureLoader().loadAsync(state.sticker.texture).then(t => {
            t.colorSpace = THREE.SRGBColorSpace;
            stickerTexture = t;
            resources.push(t);
        }));
   }

    await Promise.all(promises);

    // Build Material
    const uniforms = createUniformsFromState(state, maskTexture, baseTexture, stickerTexture);
    
    // Override resolution uniform to match export target
    uniforms.u_resolution.value.set(width, height);
    uniforms.u_viewMode.value = viewMode;

    const material = createTextureMaterial(state, uniforms);
    resources.push(material);
    
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    return { 
        renderer, 
        scene, 
        camera, 
        material, 
        cleanup: () => {
            disposeRoot(scene);
            resources.forEach(r => r.dispose && r.dispose());
        }
    };
};
