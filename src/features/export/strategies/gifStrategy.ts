
import { AppState } from '../../../core/types/types';
import { setupOffscreenScene } from '../core/offscreen';

// Bypass CORS/CDN issues with inline worker
const GIF_WORKER_SCRIPT = `
importScripts('https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js');
`;

const getGifWorkerUrl = () => {
    const blob = new Blob([GIF_WORKER_SCRIPT], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
};

export const generateGif = async (
    state: AppState, 
    onProgress: (p: number) => void
): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
        try {
            const { resolution, spriteSheet } = state;
            // Limit GIF size for performance/memory
            const gifResolution = Math.min(resolution, 512); 
            
            const workerUrl = getGifWorkerUrl();
            
            // @ts-ignore
            const gif = new GIF({
                workers: 2,
                quality: 10,
                width: gifResolution,
                height: gifResolution,
                workerScript: workerUrl,
                transparent: 0x000000
            });

            const { renderer, scene, camera, material, cleanup } = await setupOffscreenScene(
                state, gifResolution, gifResolution, state.viewMode
            );
            
            const startTime = Date.now();

            for (let i = 0; i < spriteSheet.totalFrames; i++) {
                // Watchdog: 20s timeout
                if (Date.now() - startTime > 20000) {
                    throw new Error("GIF generation timed out");
                }

                material.uniforms.u_time.value = (i / spriteSheet.totalFrames) * spriteSheet.duration;
                renderer.render(scene, camera);
                
                gif.addFrame(renderer.domElement, { 
                    copy: true, 
                    delay: (spriteSheet.duration / spriteSheet.totalFrames) * 1000 
                });
                
                // Rendering Phase Progress (0-50%)
                onProgress(Math.round((i / spriteSheet.totalFrames) * 50));
                
                // Yield to main thread to keep UI responsive
                await new Promise(r => setTimeout(r, 10));
            }

            cleanup();

            gif.on('progress', (p: number) => {
                // Encoding Phase Progress (50-100%)
                onProgress(50 + Math.round(p * 50));
            });

            gif.on('finished', (blob: Blob) => {
                URL.revokeObjectURL(workerUrl); 
                resolve(blob);
            });
            
            gif.on('abort', () => reject(new Error("GIF generation aborted")));

            gif.render();

        } catch (e) {
            reject(e);
        }
    });
};
