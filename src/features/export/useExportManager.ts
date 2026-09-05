import { useState, useCallback, useRef } from "react";
import { AppState, ViewMode } from "../../core/types/types";
import { downloadBlob } from "./core/browserFiles";

interface UseExportManagerProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

type ExportTask = (state: AppState, onProgress: (progress: number) => void) => Promise<Blob>;
type ExportTaskLoader = () => Promise<ExportTask>;

const exportTaskLoaders = {
  sprite: () => import("./strategies/spriteStrategy").then((module) => module.generateSpriteSheet),
  gif: () => import("./strategies/gifStrategy").then((module) => module.generateGif),
  video: () => import("./strategies/videoStrategy").then((module) => module.generateVideo),
  zip: () => import("./strategies/zipStrategy").then((module) => module.generateTexturePack),
  html: () => import("./legacy/standaloneHtml").then((module) => module.generateHtml),
  glb: () => import("./strategies/glbStrategy").then((module) => module.generateGlb),
} satisfies Record<string, ExportTaskLoader>;

export function useExportManager(
  state: AppState,
  { onSuccess, onError }: UseExportManagerProps = {},
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTaskName, setActiveTaskName] = useState<string | null>(null);
  const activeTaskRef = useRef(false);
  const stateRef = useRef(state);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  stateRef.current = state;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const runExportTask = useCallback(
    async (taskName: string, filename: string, loadTask: ExportTaskLoader) => {
      if (activeTaskRef.current) {
        onErrorRef.current?.("An export is already in progress");
        return;
      }
      const snapshot = stateRef.current;
      activeTaskRef.current = true;
      setIsGenerating(true);
      setActiveTaskName(taskName);
      setProgress(0);

      try {
        const taskFn = await loadTask();
        const blob = await taskFn(snapshot, setProgress);
        if (blob.size === 0) throw new Error(`${taskName} generated an empty file`);
        downloadBlob(blob, filename);
        onSuccessRef.current?.(`${taskName} Exported`);
      } catch (e) {
        console.error(e);
        onErrorRef.current?.(`${taskName} Failed: ${getErrorMessage(e)}`);
      } finally {
        activeTaskRef.current = false;
        setIsGenerating(false);
        setActiveTaskName(null);
        setProgress(0);
      }
    },
    [],
  );

  const generateHighResImage = useCallback(
    async (overrideViewMode?: ViewMode) => {
      const snapshot = stateRef.current;
      const mode = overrideViewMode !== undefined ? overrideViewMode : snapshot.viewMode;
      const format = snapshot.settings.exportFormat;
      const ext = format === "jpeg" ? "jpg" : format;
      const name = `texture_${snapshot.textureType.replace(/\s/g, "_")}_${mode === ViewMode.RENDER ? "render" : "map"}.${ext}`;
      await runExportTask("Image", name, () =>
        import("./strategies/imageStrategy").then(
          (module) => (exportState, onProgress) =>
            module.generateStillImage(exportState, onProgress, mode),
        ),
      );
    },
    [runExportTask],
  );

  const generateSpriteSheet = useCallback(
    () =>
      runExportTask(
        "Sprite Sheet",
        `spritesheet_${stateRef.current.textureType.toLowerCase().replace(/\s/g, "_")}.png`,
        exportTaskLoaders.sprite,
      ),
    [runExportTask],
  );

  const generateGif = useCallback(
    () =>
      runExportTask(
        "GIF",
        `anim_${stateRef.current.textureType.toLowerCase().replace(/\s/g, "_")}.gif`,
        exportTaskLoaders.gif,
      ),
    [runExportTask],
  );

  const recordVideo = useCallback(
    () =>
      runExportTask(
        "Video",
        `video_${stateRef.current.textureType.toLowerCase().replace(/\s/g, "_")}.webm`,
        exportTaskLoaders.video,
      ),
    [runExportTask],
  );

  const downloadAllMaps = useCallback(
    () =>
      runExportTask(
        "Texture Pack",
        `TexturePack_${stateRef.current.textureType.replace(/\s/g, "_")}.zip`,
        exportTaskLoaders.zip,
      ),
    [runExportTask],
  );

  const generateHtml = useCallback(
    () =>
      runExportTask(
        "Legacy HTML",
        `legacy_shader_${stateRef.current.textureType.replace(/\s/g, "_")}.html`,
        exportTaskLoaders.html,
      ),
    [runExportTask],
  );

  const generateGlb = useCallback(
    () =>
      runExportTask(
        "GLB",
        `model_${stateRef.current.textureType.replace(/\s/g, "_")}.glb`,
        exportTaskLoaders.glb,
      ),
    [runExportTask],
  );

  return {
    isGenerating,
    progress,
    activeTaskName,
    generateHighResImage,
    generateSpriteSheet,
    generateGif,
    recordVideo,
    downloadAllMaps,
    generateHtml,
    generateGlb,
  };
}
