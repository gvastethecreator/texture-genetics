
import { AppState } from '../../../core/types/types';
import { setupOffscreenScene } from '../core/offscreen';

export const generateSpriteSheet = async (
    state: AppState, 
    onProgress: (p: number) => void
): Promise<Blob> => {
    const { resolution, spriteSheet } = state;
    // Safety Clamp: max sheet size approx 8k x 8k equivalent total or texture limit
    const safeRes = Math.min(resolution, 1024);
    
    const { renderer, scene, camera, setTime, cleanup } = await setupOffscreenScene(
        state, safeRes, safeRes, state.viewMode
    );

    const totalWidth = safeRes * spriteSheet.columns;
    const totalHeight = safeRes * spriteSheet.rows;
    
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        cleanup();
        throw new Error("Could not create 2D context for Sprite Sheet");
    }
    
    const startTime = Date.now();

    for (let i = 0; i < spriteSheet.totalFrames; i++) {
        if (Date.now() - startTime > 15000) { 
            cleanup();
            throw new Error("Sprite generation timed out");
        }

        setTime((i / spriteSheet.totalFrames) * spriteSheet.duration);
        renderer.render(scene, camera);
        
        const col = i % spriteSheet.columns;
        const row = Math.floor(i / spriteSheet.columns);
        ctx.drawImage(renderer.domElement, col * safeRes, row * safeRes);
        
        onProgress(Math.round(((i + 1) / spriteSheet.totalFrames) * 100));
        await new Promise(r => setTimeout(r, 10)); // Yield
    }

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            cleanup();
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob from canvas"));
        }, 'image/png');
    });
};
