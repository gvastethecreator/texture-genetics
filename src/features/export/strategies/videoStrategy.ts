import { AppState } from "../../../core/types/types";
import { setupOffscreenScene } from "../core/offscreen";

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
  const mimeType = "video/webm;codecs=vp9";

  if (!MediaRecorder.isTypeSupported(mimeType)) {
    cleanup();
    throw new Error("VP9 WebM not supported on this browser.");
  }

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8000000, // 8 Mbps high quality
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      cleanup();
      resolve(blob);
    };
    recorder.onerror = (e) => {
      cleanup();
      reject(e);
    };
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
    recorder.stop();
    cleanup();
    throw e;
  }

  recorder.stop();
  return recordingPromise;
};
