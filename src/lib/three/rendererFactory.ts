import * as THREE from "three";
import { WebGPURenderer } from "three/webgpu";

export type CanvasRenderer = THREE.WebGLRenderer | WebGPURenderer;

interface RendererInitProps {
  canvas?: HTMLCanvasElement | OffscreenCanvas;
  antialias?: boolean;
  alpha?: boolean;
  dpr?: number;
}

/**
 * Initialize renderer with automatic fallback from WebGPU to WebGL
 */
export async function initializeRenderer(props: RendererInitProps): Promise<CanvasRenderer> {
  const { antialias = true, alpha = false } = props;
  const canvas = props.canvas instanceof HTMLCanvasElement ? props.canvas : undefined;
  const preferWebGLBackend =
    typeof navigator !== "undefined" && /windows/i.test(navigator.userAgent);

  // Try WebGPU first
  try {
    console.log(
      `[Renderer] Attempting ${preferWebGLBackend ? "WebGL2 backend via WebGPURenderer" : "WebGPU"} initialization...`,
    );
    const webgpuRenderer = new WebGPURenderer({
      ...(canvas ? { canvas } : {}),
      antialias,
      alpha,
      powerPreference: "high-performance",
      forceWebGL: preferWebGLBackend,
    });

    await webgpuRenderer.init();
    console.log(
      `[Renderer] ✓ ${preferWebGLBackend ? "WebGL2 backend" : "WebGPU"} initialized successfully`,
    );
    return webgpuRenderer;
  } catch (webgpuError) {
    console.warn(
      "[Renderer] WebGPURenderer initialization failed, falling back to plain WebGLRenderer:",
      webgpuError,
    );

    // Fallback to WebGL
    try {
      const glRenderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        alpha,
        powerPreference: "high-performance",
      });

      glRenderer.setPixelRatio(props.dpr || Math.min(window.devicePixelRatio, 2));

      // Enable shadow mapping and tone mapping for WebGL
      glRenderer.shadowMap.enabled = true;
      glRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
      glRenderer.toneMappingExposure = 1.0;

      console.log("[Renderer] ✓ WebGL initialized as fallback");
      return glRenderer;
    } catch (glError) {
      console.error("[Renderer] Both WebGPU and WebGL failed:", glError);
      throw new Error("Failed to initialize renderer: WebGPU and WebGL both failed.", {
        cause: glError,
      });
    }
  }
}
