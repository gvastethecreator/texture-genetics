import { AppState, ViewMode } from "../../../core/types/types";
import { setupOffscreenScene } from "../core/offscreen";
import { canvasToBlob } from "../core/browserFiles";

export const STILL_EXPORT_MAX_RESOLUTION = 4096;

export const generateStillImage = async (
  state: AppState,
  onProgress: (progress: number) => void,
  overrideViewMode?: ViewMode,
): Promise<Blob> => {
  onProgress(10);
  const mode = overrideViewMode !== undefined ? overrideViewMode : state.viewMode;
  const safeRes = Math.min(state.resolution, STILL_EXPORT_MAX_RESOLUTION);
  const offscreen = await setupOffscreenScene(state, safeRes, safeRes, mode);
  try {
    offscreen.setTime(state.animate ? 0 : state.time);
    offscreen.renderer.render(offscreen.scene, offscreen.camera);
    onProgress(80);
    const format = state.settings.exportFormat;
    const blob = await canvasToBlob(offscreen.renderer.domElement, `image/${format}`, 0.9);
    onProgress(100);
    return blob;
  } finally {
    offscreen.cleanup();
  }
};
