
import { useEffect } from 'react';

interface HotkeyMap {
  [key: string]: (e: KeyboardEvent) => void;
}

export const useHotkeys = (keyMap: HotkeyMap) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Robust check for input focus
      const target = e.target as HTMLElement;
      
      // Elite Input Guard: Check explicitly for form elements and contentEditable
      const isInput = 
          target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          (target.getAttribute('role') === 'textbox');

      if (isInput) {
        return;
      }

      const combo = [
        e.ctrlKey || e.metaKey ? 'mod' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      // Check specific combo first, then single key
      const handler = keyMap[combo] || keyMap[e.key.toLowerCase()];
      
      if (e.code === 'Space' && keyMap['space']) {
          e.preventDefault();
          keyMap['space'](e);
          return;
      }

      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyMap]);
};