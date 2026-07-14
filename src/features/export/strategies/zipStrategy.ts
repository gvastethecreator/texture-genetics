import JSZip from "jszip";
import { AppState, ViewMode } from "../../../core/types/types";
import { setupOffscreenScene } from "../core/offscreen";
import { canvasToBlob } from "../core/browserFiles";
import { createIdempotentFinalizer } from "../core/finalization";

export const generateTexturePack = async (
  state: AppState,
  onProgress: (p: number) => void,
): Promise<Blob> => {
  const zip = new JSZip();
  // Clamp resolution for ZIP pack to prevent crash/timeout on heavy ops
  const safeRes = Math.min(state.resolution, 2048);

  const { renderer, scene, camera, setTime, setViewMode, cleanup } = await setupOffscreenScene(
    state,
    safeRes,
    safeRes,
    ViewMode.ALBEDO,
  );
  const finalize = createIdempotentFinalizer(cleanup);

  const maps = [
    { mode: ViewMode.ALBEDO, name: "Albedo" },
    { mode: ViewMode.NORMAL, name: "Normal" },
    { mode: ViewMode.HEIGHT, name: "Height" },
    { mode: ViewMode.UV, name: "UV" }, // Add
    { mode: ViewMode.RENDER, name: "Preview" },
  ];

  const format = state.settings.exportFormat;
  const ext = format === "jpeg" ? "jpg" : format;
  const mime = `image/${format}`;

  try {
    for (let i = 0; i < maps.length; i++) {
      const map = maps[i];

      // Switch Mode
      setViewMode(map.mode);
      setTime(state.time);

      renderer.render(scene, camera);

      const blob = await canvasToBlob(renderer.domElement, mime, 0.9);
      zip.file(`${map.name}.${ext}`, blob);

      onProgress(Math.round(((i + 1) / maps.length) * 80));
      await new Promise((r) => setTimeout(r, 10)); // Yield
    }

    onProgress(90);
    return await zip.generateAsync({ type: "blob" });
  } finally {
    finalize();
  }
};
