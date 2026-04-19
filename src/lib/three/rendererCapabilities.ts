import type { CanvasRenderer } from "./rendererFactory";

export type RendererBackendKind = "webgpu" | "webgl-via-webgpu" | "webgl" | "unknown";

type BackendInfo = {
  isWebGLBackend?: boolean;
  isWebGPUBackend?: boolean;
};

type RendererLike = Partial<CanvasRenderer> & {
  isWebGPURenderer?: boolean;
  backend?: BackendInfo;
  getContext?: () => unknown;
};

const hasWebGLContext = (renderer: RendererLike): boolean => {
  try {
    const context = renderer.getContext?.() as { getContextAttributes?: () => unknown } | undefined;
    return typeof context?.getContextAttributes === "function";
  } catch {
    return false;
  }
};

export const getRendererBackendKind = (
  renderer: RendererLike | null | undefined,
): RendererBackendKind => {
  if (!renderer) return "unknown";

  if (renderer.backend?.isWebGPUBackend) {
    return "webgpu";
  }

  if (renderer.backend?.isWebGLBackend) {
    return renderer.isWebGPURenderer ? "webgl-via-webgpu" : "webgl";
  }

  if (hasWebGLContext(renderer)) {
    return renderer.isWebGPURenderer ? "webgl-via-webgpu" : "webgl";
  }

  if (renderer.isWebGPURenderer) {
    return "webgpu";
  }

  return "unknown";
};

export const supportsWebGLOnlyAddons = (renderer: RendererLike | null | undefined): boolean => {
  const kind = getRendererBackendKind(renderer);
  return kind === "webgl" || kind === "webgl-via-webgpu";
};

export const supportsAdvancedWebGLRenderTargets = (
  renderer: RendererLike | null | undefined,
): boolean => {
  const kind = getRendererBackendKind(renderer);
  return kind === "webgl";
};

export const getRendererBackendLabel = (renderer: RendererLike | null | undefined): string => {
  switch (getRendererBackendKind(renderer)) {
    case "webgpu":
      return "WebGPU";
    case "webgl-via-webgpu":
      return "WebGL2 via WebGPU";
    case "webgl":
      return "WebGL2";
    default:
      return "Renderer?";
  }
};
