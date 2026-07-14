import React, { useState, useRef, useEffect, memo, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  onCommit?: () => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = memo(
  ({ label, color, onChange, onCommit }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
    const pickerId = useId();
    const containerRef = useRef<HTMLDivElement>(null);

    // Internal state for smooth drag, decoupled from heavy parent updates
    const [internalColor, setInternalColor] = useState(color);

    // Throttle Ref
    const lastUpdate = useRef(0);

    // Sync external changes
    useEffect(() => {
      setInternalColor(color);
    }, [color]);

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPickerPos({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX,
        });
      }
    };

    const handleToggle = () => {
      if (!showPicker) {
        updatePosition();
      }
      setShowPicker(!showPicker);
    };

    const handleChange = useCallback(
      (newColor: string) => {
        setInternalColor(newColor);

        const now = Date.now();
        // Throttle updates to parent to 30ms (~30fps) to avoid React tree thrashing
        if (now - lastUpdate.current > 32) {
          onChange(newColor);
          lastUpdate.current = now;
        }
      },
      [onChange],
    );

    const handleCommit = useCallback(() => {
      // Ensure final value is sent, bypassing throttle
      onChange(internalColor);
      if (onCommit) onCommit();
    }, [onChange, onCommit, internalColor]);

    useEffect(() => {
      if (!showPicker) return;
      document.addEventListener("pointerup", handleCommit);
      return () => document.removeEventListener("pointerup", handleCommit);
    }, [handleCommit, showPicker]);

    return (
      <div className="flex flex-col gap-1.5 relative" ref={containerRef}>
        <span className="text-[11px] font-medium text-gray-400 font-sans tracking-wide select-none">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggle}
            aria-label={`${label}: ${internalColor}`}
            aria-expanded={showPicker}
            aria-controls={pickerId}
            className="w-full h-8 rounded border border-border shadow-sm flex items-center justify-between px-2 transition-all hover:border-gray-500 group"
            style={{ backgroundColor: internalColor }}
          >
            <span className="text-[10px] font-mono bg-black/50 text-white px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
              {internalColor.toUpperCase()}
            </span>
          </button>
        </div>

        {showPicker &&
          createPortal(
            <>
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Close ${label} color picker`}
                className="fixed inset-0 z-[9998]"
                onClick={() => {
                  setShowPicker(false);
                  if (onCommit) onCommit();
                }}
              />
              <div
                id={pickerId}
                role="dialog"
                aria-label={`${label} color picker`}
                className="fixed z-[9999] shadow-2xl animate-in fade-in zoom-in-95 origin-top-left"
                style={{ top: pickerPos.top, left: pickerPos.left }}
              >
                <HexColorPicker color={internalColor} onChange={handleChange} />
                <input
                  type="color"
                  aria-label={`${label} native color input`}
                  value={internalColor}
                  onChange={(event) => handleChange(event.target.value)}
                  className="mt-2 h-8 w-full cursor-pointer rounded border border-white/10 bg-[#121212]"
                />
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  },
);
