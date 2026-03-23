
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Hook to load textures safely with automatic disposal of previous assets.
 * Prevents WebGL memory leaks when switching images rapidly.
 */
export const useTextureResource = (url: string | null) => {
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const lastUrlRef = useRef<string | null>(null);

    useEffect(() => {
        // 1. If URL hasn't changed, do nothing
        if (url === lastUrlRef.current) return;
        lastUrlRef.current = url;

        // 2. If URL is null, dispose current and clear
        if (!url) {
            setTexture(prev => {
                if (prev) prev.dispose();
                return null;
            });
            return;
        }

        let active = true;
        const loader = new THREE.TextureLoader();

        loader.load(
            url,
            (tex) => {
                if (!active) {
                    tex.dispose();
                    return;
                }
                
                // Optimized settings for pixel-perfect rendering or smooth blending
                tex.colorSpace = THREE.SRGBColorSpace;
                
                setTexture(prev => {
                    // CRITICAL: Dispose the OLD texture before setting the NEW one
                    if (prev) prev.dispose();
                    return tex;
                });
            },
            undefined,
            (err) => {
                console.warn(`Failed to load texture: ${url}`, err);
                if (active) {
                    setTexture(prev => {
                        if (prev) prev.dispose();
                        return null;
                    });
                }
            }
        );

        return () => {
            active = false;
        };
    }, [url]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (texture) texture.dispose();
        };
    }, []);

    return texture;
};
