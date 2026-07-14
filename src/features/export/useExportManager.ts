import { useState, useCallback, useRef } from "react";
import { AppState, ViewMode } from "../../core/types/types";
import { setupOffscreenScene } from "./core/offscreen";
import { generateGif } from "./strategies/gifStrategy";
import { generateSpriteSheet } from "./strategies/spriteStrategy";
import { generateVideo } from "./strategies/videoStrategy";
import { generateTexturePack } from "./strategies/zipStrategy";
import { generateHtml } from "./strategies/htmlStrategy";
import { generateGlb } from "./strategies/glbStrategy";
import { canvasToBlob, downloadBlob } from "./core/browserFiles";

interface UseExportManagerProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export function useExportManager(
  state: AppState,
  { onSuccess, onError }: UseExportManagerProps = {},
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeTaskRef = useRef(false);

  // --- Single Image Export ---
  const generateHighResImage = useCallback(
    async (overrideViewMode?: ViewMode) => {
      if (activeTaskRef.current) {
        onError?.("An export is already in progress");
        return;
      }
      activeTaskRef.current = true;
      setIsGenerating(true);
      setProgress(10);

      let cleanup: (() => void) | undefined;

      try {
        // Give UI a moment to update
        await new Promise((r) => setTimeout(r, 50));

        const mode = overrideViewMode !== undefined ? overrideViewMode : state.viewMode;
        // Allow up to 4096, but warn user in UI (Settings)
        const safeRes = Math.min(state.resolution, 4096);

        const offscreen = await setupOffscreenScene(state, safeRes, safeRes, mode);
        const { renderer, scene, camera, setTime } = offscreen;
        cleanup = offscreen.cleanup;

        setTime(state.animate ? 0 : state.time);
        renderer.render(scene, camera);

        const format = state.settings.exportFormat;
        const ext = format === "jpeg" ? "jpg" : format;

        const blob = await canvasToBlob(renderer.domElement, `image/${format}`, 0.9);
        if (blob.size === 0) throw new Error("Generated image is empty");
        const name = `texture_${state.textureType.replace(/\s/g, "_")}_${mode === ViewMode.RENDER ? "render" : "map"}.${ext}`;
        downloadBlob(blob, name);
        if (onSuccess) onSuccess(`Exported ${name}`);
      } catch (e) {
        console.error(e);
        if (onError) onError(`Export Failed: ${getErrorMessage(e)}`);
      } finally {
        cleanup?.();
        activeTaskRef.current = false;
        setIsGenerating(false);
        setProgress(0);
      }
    },
    [state, onSuccess, onError],
  );

  // --- Complex Exports Wrapper ---
  const runExportTask = useCallback(
    async (
      taskName: string,
      filename: string,
      taskFn: (s: AppState, cb: (p: number) => void) => Promise<Blob>,
    ) => {
      if (activeTaskRef.current) {
        onError?.("An export is already in progress");
        return;
      }
      activeTaskRef.current = true;
      setIsGenerating(true);
      setProgress(0);

      try {
        const blob = await taskFn(state, setProgress);
        if (blob.size === 0) throw new Error(`${taskName} generated an empty file`);
        downloadBlob(blob, filename);
        if (onSuccess) onSuccess(`${taskName} Exported`);
      } catch (e) {
        console.error(e);
        if (onError) onError(`${taskName} Failed: ${getErrorMessage(e)}`);
      } finally {
        activeTaskRef.current = false;
        setIsGenerating(false);
        setProgress(0);
      }
    },
    [state, onSuccess, onError],
  );

  // --- Public API ---
  const runSpriteSheet = () =>
    runExportTask(
      "Sprite Sheet",
      `spritesheet_${state.textureType.toLowerCase().replace(/\s/g, "_")}.png`,
      generateSpriteSheet,
    );

  const runGif = () =>
    runExportTask(
      "GIF",
      `anim_${state.textureType.toLowerCase().replace(/\s/g, "_")}.gif`,
      generateGif,
    );

  const runVideo = () =>
    runExportTask(
      "Video",
      `video_${state.textureType.toLowerCase().replace(/\s/g, "_")}.webm`,
      generateVideo,
    );

  const runZip = () =>
    runExportTask(
      "Texture Pack",
      `TexturePack_${state.textureType.replace(/\s/g, "_")}.zip`,
      generateTexturePack,
    );

  const runHtml = () =>
    runExportTask(
      "Legacy HTML",
      `legacy_shader_${state.textureType.replace(/\s/g, "_")}.html`,
      generateHtml,
    );

  const runGlb = () =>
    runExportTask("GLB", `model_${state.textureType.replace(/\s/g, "_")}.glb`, generateGlb);

  return {
    isGenerating,
    progress,
    generateHighResImage,
    generateSpriteSheet: runSpriteSheet,
    generateGif: runGif,
    recordVideo: runVideo,
    downloadAllMaps: runZip,
    generateHtml: runHtml,
    generateGlb: runGlb,
  };
}
