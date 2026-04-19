import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Hook to load textures safely with automatic disposal of previous assets.
 * Prevents WebGL memory leaks when switching images rapidly.
 */
export const useTextureResource = (url: string | null) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const lastUrlRef = useRef<string | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    // 1. If URL hasn't changed, do nothing
    if (url === lastUrlRef.current) return;
    lastUrlRef.current = url;

    // 2. If URL is null, dispose current and clear
    if (!url) {
      setTexture((prev) => {
        if (prev) prev.dispose();
        return null;
      });
      return;
    }

    activeRef.current = true;
    const loader = new THREE.TextureLoader();

    loader.load(
      url,
      (tex) => {
        if (!activeRef.current) {
          tex.dispose();
          return;
        }

        // Optimized settings for pixel-perfect rendering or smooth blending
        tex.colorSpace = THREE.SRGBColorSpace;

        setTexture((prev) => {
          // CRITICAL: Dispose the OLD texture before setting the NEW one
          if (prev) prev.dispose();
          return tex;
        });
      },
      undefined,
      (err) => {
        console.warn(`Failed to load texture: ${url}`, err);
        if (activeRef.current) {
          setTexture((prev) => {
            if (prev) prev.dispose();
            return null;
          });
        }
      },
    );

    return () => {
      activeRef.current = false;
    };
  }, [url]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeRef.current && texture) texture.dispose();
    };
  }, [texture]);

  return texture;
};
