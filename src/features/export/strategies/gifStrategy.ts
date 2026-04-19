import { encode } from "modern-gif";
// @ts-ignore — Vite ?url import for Web Worker
import workerUrl from "modern-gif/worker?url";
import { AppState } from "../../../core/types/types";
import { setupOffscreenScene } from "../core/offscreen";

export const generateGif = async (
  state: AppState,
  onProgress: (p: number) => void,
): Promise<Blob> => {
  const { resolution, spriteSheet } = state;
  const gifResolution = Math.min(resolution, 512);

  const { renderer, scene, camera, setTime, cleanup } = await setupOffscreenScene(
    state,
    gifResolution,
    gifResolution,
    state.viewMode,
  );

  const canvas = renderer.domElement;
  const frames: { data: Uint8ClampedArray; delay: number }[] = [];
  const delayMs = Math.round((spriteSheet.duration / spriteSheet.totalFrames) * 1000);
  const startTime = Date.now();

  try {
    for (let i = 0; i < spriteSheet.totalFrames; i++) {
      if (Date.now() - startTime > 20000) {
        throw new Error("GIF generation timed out");
      }

      setTime((i / spriteSheet.totalFrames) * spriteSheet.duration);
      renderer.render(scene, camera);

      // Read pixels from WebGL canvas
      const ctx = document.createElement("canvas").getContext("2d")!;
      ctx.canvas.width = gifResolution;
      ctx.canvas.height = gifResolution;
      ctx.drawImage(canvas, 0, 0);
      const imageData = ctx.getImageData(0, 0, gifResolution, gifResolution);

      frames.push({ data: imageData.data, delay: delayMs });

      onProgress(Math.round((i / spriteSheet.totalFrames) * 50));
      await new Promise((r) => setTimeout(r, 10));
    }
  } finally {
    cleanup();
  }

  onProgress(55);

  let output: ArrayBuffer;
  try {
    output = await encode({
      workerUrl,
      width: gifResolution,
      height: gifResolution,
      frames,
    });
  } catch (encodeError) {
    throw new Error(
      `GIF encoding failed: ${encodeError instanceof Error ? encodeError.message : String(encodeError)}`,
      { cause: encodeError },
    );
  }

  onProgress(100);
  return new Blob([output], { type: "image/gif" });
};
