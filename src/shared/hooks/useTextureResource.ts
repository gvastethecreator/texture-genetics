import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

/** Loads one texture at a time and prevents stale callbacks from winning URL races. */
export const useTextureResource = (url: string | null) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const generationRef = useRef(0);

  useEffect(() => {
    const generation = ++generationRef.current;

    const replaceTexture = (next: THREE.Texture | null) => {
      const previous = textureRef.current;
      if (previous && previous !== next) previous.dispose();
      textureRef.current = next;
      setTexture(next);
    };

    if (!url) {
      replaceTexture(null);
      return () => {
        if (generationRef.current === generation) generationRef.current += 1;
      };
    }

    new THREE.TextureLoader().load(
      url,
      (loadedTexture) => {
        if (generationRef.current !== generation) {
          loadedTexture.dispose();
          return;
        }
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        replaceTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load texture: ${url}`, error);
        if (generationRef.current === generation) replaceTexture(null);
      },
    );

    return () => {
      if (generationRef.current === generation) generationRef.current += 1;
    };
  }, [url]);

  useEffect(
    () => () => {
      generationRef.current += 1;
      textureRef.current?.dispose();
      textureRef.current = null;
    },
    [],
  );

  return texture;
};
