import { AppState } from "../../../core/types/types";
import { setupOffscreenScene } from "../core/offscreen";
import { createIdempotentFinalizer } from "../core/finalization";

export const generateVideo = async (
  state: AppState,
  onProgress: (p: number) => void,
): Promise<Blob> => {
  const { resolution, spriteSheet } = state;
  // Video encoders prefer standard dimensions (multiples of 2), limit to 1080p equivalent
  const safeRes = Math.min(resolution, 1024);

  const { renderer, scene, camera, setTime, cleanup } = await setupOffscreenScene(
    state,
    safeRes,
    safeRes,
    state.viewMode,
  );

  const stream = renderer.domElement.captureStream(60); // 60 FPS target
  const finalize = createIdempotentFinalizer(() => {
    stream.getTracks().forEach((track) => track.stop());
    cleanup();
  });
  const mimeType = "video/webm;codecs=vp9";

  if (!MediaRecorder.isTypeSupported(mimeType)) {
    finalize();
    throw new Error("VP9 WebM not supported on this browser.");
  }

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 8000000, // 8 Mbps high quality
    });
  } catch (error) {
    finalize();
    throw error;
  }

  const chunks: Blob[] = [];
  recorder.addEventListener("dataavailable", (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  });

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.addEventListener(
      "stop",
      () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        finalize();
        resolve(blob);
      },
      { once: true },
    );
    recorder.addEventListener(
      "error",
      (e) => {
        finalize();
        reject(e);
      },
      { once: true },
    );
  });

  recorder.start();

  // Render Loop
  const fps = 60;
  const totalFrames = Math.ceil(spriteSheet.duration * fps);

  try {
    for (let i = 0; i < totalFrames; i++) {
      setTime((i / totalFrames) * spriteSheet.duration);
      renderer.render(scene, camera);
      // Real-time wait to match frame timing for recorder
      await new Promise((r) => setTimeout(r, 1000 / fps));
      onProgress(Math.round((i / totalFrames) * 100));
    }
  } catch (e) {
    if (recorder.state !== "inactive") recorder.stop();
    finalize();
    throw e;
  }

  recorder.stop();
  return recordingPromise;
};
