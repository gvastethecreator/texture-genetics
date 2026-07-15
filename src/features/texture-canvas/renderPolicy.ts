import { PreviewAnimation, type AppState } from "../../core/types/types";

export const hasActiveSceneEffects = (state: AppState): boolean => {
  const environment = state.environment;
  return (
    environment.sceneBloom ||
    environment.sceneScanlines ||
    environment.scenePixelate ||
    environment.sceneGlitch ||
    environment.sceneChromatic ||
    environment.sceneNoise ||
    environment.sceneVignette ||
    environment.sceneOutline ||
    environment.sceneTiltShift ||
    environment.sceneAscii ||
    environment.sceneDither ||
    environment.sceneRuttEtra
  );
};

/**
 * Keep the GPU loop alive only for state that changes without a React render.
 * Pointer/camera events and state edits invalidate demand-mode canvases themselves.
 */
export const requiresContinuousRendering = (state: AppState): boolean =>
  state.animate ||
  state.environment.animation !== PreviewAnimation.NONE ||
  state.environment.particlesEnabled ||
  state.environment.smokeEnabled ||
  hasActiveSceneEffects(state);
