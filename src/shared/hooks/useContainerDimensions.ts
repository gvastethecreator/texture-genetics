
import { useState, useEffect, useRef } from 'react';

export const useContainerDimensions = () => {
  const ref = useRef<HTMLDivElement>(null);
  // Initialize with window dimensions as a safe fallback to prevent 0/0 division in Three.js cameras
  const [dimensions, setDimensions] = useState({ 
      width: window.innerWidth, 
      height: window.innerHeight 
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries) || !entries.length) return;
      
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      
      // Prevent 0x0 updates that might break the renderer
      if (width > 0 && height > 0) {
          requestAnimationFrame(() => {
              setDimensions({ width, height });
          });
      }
    });

    resizeObserver.observe(element);

    return () => {
      if (element) resizeObserver.unobserve(element);
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, dimensions };
};
