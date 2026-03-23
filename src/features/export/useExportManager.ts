
import { useState, useCallback } from 'react';
import { AppState, ViewMode } from '../../core/types/types';
import { setupOffscreenScene } from './core/offscreen';
import { generateGif } from './strategies/gifStrategy';
import { generateSpriteSheet } from './strategies/spriteStrategy';
import { generateVideo } from './strategies/videoStrategy';
import { generateTexturePack } from './strategies/zipStrategy';
import { generateHtml } from './strategies/htmlStrategy';
import { generateGlb } from './strategies/glbStrategy';

interface UseExportManagerProps {
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
}

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export function useExportManager(state: AppState, { onSuccess, onError }: UseExportManagerProps = {}) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    // --- Single Image Export ---
    const generateHighResImage = useCallback(async (overrideViewMode?: ViewMode) => {
        if (isGenerating) return;
        setIsGenerating(true);
        setProgress(10);

        try {
            // Give UI a moment to update
            await new Promise(r => setTimeout(r, 50));

            const mode = overrideViewMode !== undefined ? overrideViewMode : state.viewMode;
            // Allow up to 4096, but warn user in UI (Settings)
            const safeRes = Math.min(state.resolution, 4096);
            
            const { renderer, scene, camera, material, cleanup } = await setupOffscreenScene(
                state, safeRes, safeRes, mode
            );
            
            material.uniforms.u_time.value = state.animate ? 0 : state.time;
            renderer.render(scene, camera);
            
            const format = state.settings.exportFormat;
            const ext = format === 'jpeg' ? 'jpg' : format;
            
            renderer.domElement.toBlob((blob) => {
                if (blob) {
                    const name = `texture_${state.textureType.replace(/\s/g, '_')}_${mode === ViewMode.RENDER ? 'render' : 'map'}.${ext}`;
                    downloadBlob(blob, name);
                    if (onSuccess) onSuccess(`Exported ${name}`);
                } else {
                    if (onError) onError("Failed to create image blob");
                }
                cleanup();
                setIsGenerating(false);
                setProgress(0);
            }, `image/${format}`, 0.9);

        } catch (e) {
            console.error(e);
            if (onError) onError("Export Failed");
            setIsGenerating(false);
        }
    }, [state, isGenerating, onSuccess, onError]);

    // --- Complex Exports Wrapper ---
    const runExportTask = useCallback(async (
        taskName: string,
        filename: string,
        taskFn: (s: AppState, cb: (p: number) => void) => Promise<Blob>
    ) => {
        if (isGenerating) return;
        setIsGenerating(true);
        setProgress(0);

        try {
            const blob = await taskFn(state, setProgress);
            downloadBlob(blob, filename);
            if (onSuccess) onSuccess(`${taskName} Exported`);
        } catch (e: any) {
            console.error(e);
            if (onError) onError(`${taskName} Failed: ${e.message}`);
        } finally {
            setIsGenerating(false);
            setProgress(0);
        }
    }, [state, isGenerating, onSuccess, onError]);

    // --- Public API ---
    const runSpriteSheet = () => runExportTask(
        "Sprite Sheet", 
        `spritesheet_${state.textureType.toLowerCase().replace(/\s/g, '_')}.png`, 
        generateSpriteSheet
    );

    const runGif = () => runExportTask(
        "GIF", 
        `anim_${state.textureType.toLowerCase().replace(/\s/g, '_')}.gif`, 
        generateGif
    );

    const runVideo = () => runExportTask(
        "Video", 
        `video_${state.textureType.toLowerCase().replace(/\s/g, '_')}.webm`, 
        generateVideo
    );

    const runZip = () => runExportTask(
        "Texture Pack", 
        `TexturePack_${state.textureType.replace(/\s/g, '_')}.zip`, 
        generateTexturePack
    );

    const runHtml = () => runExportTask(
        "HTML", 
        `shader_${state.textureType.replace(/\s/g, '_')}.html`, 
        generateHtml
    );

    const runGlb = () => runExportTask(
        "GLB", 
        `model_${state.textureType.replace(/\s/g, '_')}.glb`, 
        generateGlb
    );

    return {
        isGenerating,
        progress,
        generateHighResImage,
        generateSpriteSheet: runSpriteSheet,
        generateGif: runGif,
        recordVideo: runVideo,
        downloadAllMaps: runZip,
        generateHtml: runHtml,
        generateGlb: runGlb
    };
}
