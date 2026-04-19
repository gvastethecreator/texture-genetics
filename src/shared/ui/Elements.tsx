import React, { useState, useEffect, memo, useRef } from "react";
import { createPortal } from "react-dom";
import * as Icons from "lucide-react";
import { LucideIcon } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AnimationConfig, WaveType } from "../../core/types/types";
import { calculateAnimatedValue } from "../../shared/utils/animationUtils";

gsap.registerPlugin(useGSAP);

// --- PORTAL TOOLTIP (Ensures tooltips escape overflow:hidden) ---
export const PortalTooltip: React.FC<{ label: string; children: React.ReactElement }> = ({
  label,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);

  const show = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Position ABOVE the element by default
      setPos({
        top: rect.top - 34, // Offset upwards
        left: rect.left + rect.width / 2,
      });
      setIsVisible(true);
    }
  };

  const hide = () => setIsVisible(false);

  return (
    <>
      {React.cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onMouseEnter: show,
        onMouseLeave: hide,
      })}
      {isVisible &&
        createPortal(
          <div
            className="fixed z-[9999] px-2.5 py-1.5 bg-[#1a1a1a] border border-white/10 text-gray-200 text-[10px] font-bold tracking-wide rounded-md shadow-xl pointer-events-none transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150 whitespace-nowrap backdrop-blur-md"
            style={{
              top: pos.top,
              left: pos.left,
              boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            {label}
            {/* Downward arrow indicator */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#1a1a1a]" />
          </div>,
          document.body,
        )}
    </>
  );
};

export const Label: React.FC<{ label: string; value?: string | number; description?: string }> =
  memo(({ label, description }) => (
    <div className="flex justify-between items-center mb-1.5 group relative">
      <span
        className="text-[11px] font-bold text-gray-400 font-sans tracking-wide cursor-help border-b border-dashed border-transparent group-hover:border-gray-600 transition-colors select-none drop-shadow-sm"
        title={description}
      >
        {label}
      </span>
    </div>
  ));

interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  animConfig?: AnimationConfig;
  onAnimChange?: (config: AnimationConfig) => void;
}

const DEFAULT_ANIM_CONFIG: AnimationConfig = {
  enabled: false,
  type: WaveType.SINE,
  speed: 1.0,
  min: 0,
  max: 1,
};

export const Slider: React.FC<SliderProps> = memo(
  ({ value, min, max, step = 0.1, onChange, onCommit, animConfig, onAnimChange }) => {
    const [inputValue, setInputValue] = useState<string>(value.toString());
    const [isFocused, setIsFocused] = useState(false);
    const [showAnimPanel, setShowAnimPanel] = useState(false);
    const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number>(0);

    useEffect(() => {
      if (!isFocused) {
        const isInt = Number.isInteger(value);
        const displayVal = isInt ? value.toString() : parseFloat(value.toFixed(3)).toString();
        setInputValue(displayVal);
      }
    }, [value, isFocused]);

    useEffect(() => {
      const isAnimated = animConfig?.enabled;

      const animate = () => {
        if (animConfig && progressRef.current) {
          const time = performance.now() / 1000;
          const val = calculateAnimatedValue(time, animConfig);
          const percentage = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

          progressRef.current.style.width = `${percentage}%`;
          if (knobRef.current) {
            knobRef.current.style.left = `calc(${percentage}% - 7px)`; // Adjusted for larger knob
          }
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      if (isAnimated) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
        if (progressRef.current) progressRef.current.style.width = `${percentage}%`;
        if (knobRef.current) knobRef.current.style.left = `calc(${percentage}% - 7px)`;
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, [animConfig, min, max, value]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value);
      onChange(newVal);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
      setIsFocused(false);
      commitInput();
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        (e.target as HTMLInputElement).blur();
      }
    };

    const commitInput = () => {
      let val = parseFloat(inputValue);
      if (isNaN(val)) val = value;
      else val = Math.min(Math.max(val, min), max);

      onChange(val);
      const isInt = Number.isInteger(val);
      setInputValue(isInt ? val.toString() : parseFloat(val.toFixed(3)).toString());
      if (onCommit) onCommit();
    };

    const toggleAnim = () => {
      if (!onAnimChange) return;
      const newConfig = { ...(animConfig || { ...DEFAULT_ANIM_CONFIG, min, max }) };
      newConfig.enabled = !newConfig.enabled;
      onAnimChange(newConfig);
      if (newConfig.enabled) {
        updatePopoverPosition();
        setShowAnimPanel(true);
      }
    };

    const updateAnim = (partial: Partial<AnimationConfig>) => {
      if (!onAnimChange) return;
      const newConfig = { ...(animConfig || { ...DEFAULT_ANIM_CONFIG, min, max }), ...partial };
      onAnimChange(newConfig);
    };

    const updatePopoverPosition = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPopoverPos({
          top: rect.bottom + window.scrollY + 5,
          left: rect.right + window.scrollX - 192,
        });
      }
    };

    const handleDoubleClick = () => {
      let resetVal = min === 0 && max === 1 ? 0.5 : min < 0 && max > 0 ? 0 : (max + min) / 2;
      onChange(resetVal);
      if (onCommit) onCommit();
    };

    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    const isAnimated = animConfig?.enabled;

    return (
      <div className="relative">
        <div className="flex items-center gap-3 h-8 group/slider">
          {/* Haptic Slider Track */}
          <div
            className="relative flex-1 flex items-center group touch-none h-full"
            onDoubleClick={handleDoubleClick}
            title="Double-click to reset"
          >
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleSliderChange}
              onMouseUp={onCommit}
              onTouchEnd={onCommit}
              disabled={!!isAnimated}
              className={`w-full relative z-10 opacity-0 h-full ${isAnimated ? "cursor-not-allowed" : "cursor-pointer"}`}
              aria-label="Slider"
            />

            {/* Track Base */}
            <div className="absolute left-0 right-0 h-1.5 bg-[#151515] rounded-full overflow-hidden pointer-events-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)] border-b border-[#2a2a2a]">
              {/* Fill */}
              <div
                ref={progressRef}
                className={`h-full transition-all duration-75 ease-out relative overflow-hidden ${isAnimated ? "bg-gradient-to-r from-purple-600 to-purple-400" : "bg-gradient-to-r from-gray-500 to-gray-300 group-hover/slider:from-gray-400 group-hover/slider:to-white"}`}
                style={{ width: `${percentage}%` }}
              >
                {/* Shimmer Effect on Fill */}
                <div className="absolute inset-0 bg-white/20 -skew-x-12 translate-x-[-100%] animate-shimmer opacity-30" />
              </div>
            </div>

            {/* Thumb - Tactile Bead */}
            <div
              ref={knobRef}
              className={`absolute h-3.5 w-3.5 rounded-full pointer-events-none transition-all duration-150 ease-spring 
                    shadow-[0_2px_4px_rgba(0,0,0,0.6),inset_0_-1px_1px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.8)]
                    border border-black/20
                    group-active:scale-125 group-hover:scale-110 
                    ${isAnimated ? "bg-purple-300" : "bg-gradient-to-b from-white to-gray-400"}`}
              style={{ left: `calc(${percentage}% - 7px)` }}
            />
          </div>

          {/* Numeric Input - Inset Style */}
          <input
            type="text"
            disabled={!!isAnimated}
            className={`w-12 h-6 text-[10px] text-right font-mono px-1.5 rounded bg-[#0a0a0a] shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-white/5 text-gray-300 focus:text-white focus:border-white/20 focus:outline-none transition-colors ${isAnimated ? "text-purple-400 border-purple-500/30" : ""}`}
            value={isAnimated ? "~" : inputValue}
            onFocus={() => setIsFocused(true)}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
          />

          {/* Anim Trigger Button */}
          {onAnimChange && (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => {
                updatePopoverPosition();
                setShowAnimPanel(!showAnimPanel);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 relative 
                    ${
                      isAnimated
                        ? "bg-purple-600 text-white shadow-glow-sm hover:bg-purple-500"
                        : "bg-[#1a1a1a] text-gray-500 hover:text-white hover:bg-[#252525] border border-white/5 shadow-tactile hover:shadow-tactile-hover"
                    }`}
              title="Animate Parameter"
            >
              <Icons.Activity size={10} />
              {isAnimated && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_4px_rgba(255,255,255,0.8)] border border-purple-600" />
              )}
            </button>
          )}
        </div>

        {/* Animation Popover via Portal */}
        {showAnimPanel &&
          onAnimChange &&
          popoverPos &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setShowAnimPanel(false)} />
              <div
                className="fixed z-[9999] w-48 bg-[#121212] border border-[#2a2a2a] shadow-2xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-150 origin-top-right backdrop-blur-xl bg-opacity-95"
                style={{ top: popoverPos.top, left: popoverPos.left }}
              >
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-gradient">
                    Wave Function
                  </span>
                  <Toggle
                    label=""
                    checked={!!animConfig?.enabled}
                    onChange={toggleAnim}
                    onCommit={onCommit}
                  />
                </div>

                {animConfig?.enabled && (
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] text-gray-500 uppercase block mb-1.5 font-bold">
                        Waveform
                      </span>
                      <div className="flex gap-1 bg-black/40 p-1 rounded-lg shadow-inner">
                        {[
                          WaveType.SINE,
                          WaveType.COSINE,
                          WaveType.TRIANGLE,
                          WaveType.SAWTOOTH,
                          WaveType.NOISE,
                        ].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateAnim({ type: t })}
                            className={`flex-1 h-6 rounded flex items-center justify-center transition-all ${animConfig.type === t ? "bg-purple-600 text-white shadow-lg" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                            title={t}
                          >
                            {t === WaveType.SINE && <Icons.Activity size={10} />}
                            {t === WaveType.COSINE && (
                              <Icons.Activity size={10} className="scale-x-[-1]" />
                            )}
                            {t === WaveType.TRIANGLE && <Icons.Triangle size={10} />}
                            {t === WaveType.SAWTOOTH && <Icons.TrendingUp size={10} />}
                            {t === WaveType.NOISE && <Icons.Zap size={10} />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-[9px] text-gray-500 uppercase font-bold">
                          Frequency
                        </span>
                        <span className="text-[9px] font-mono text-purple-400">
                          {animConfig.speed.toFixed(1)}Hz
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.1}
                        max={5}
                        step={0.1}
                        value={animConfig.speed}
                        onChange={(e) => updateAnim({ speed: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block mb-1 font-bold">
                          Min
                        </span>
                        <input
                          type="number"
                          value={animConfig.min}
                          onChange={(e) => updateAnim({ min: parseFloat(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded px-1 py-1 text-[10px] text-gray-300 font-mono focus:border-purple-500 outline-none shadow-inner"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase block mb-1 font-bold">
                          Max
                        </span>
                        <input
                          type="number"
                          value={animConfig.max}
                          onChange={(e) => updateAnim({ max: parseFloat(e.target.value) })}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded px-1 py-1 text-[10px] text-gray-300 font-mono focus:border-purple-500 outline-none shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  },
);

export const Toggle: React.FC<{
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onCommit?: () => void;
}> = memo(({ label, checked, onChange, onCommit }) => {
  const handleClick = () => {
    onChange(!checked);
    if (onCommit) setTimeout(onCommit, 0);
  };

  return (
    <button
      type="button"
      className="w-full flex items-center justify-between py-1.5 cursor-pointer group select-none text-left focus:outline-none"
      onClick={handleClick}
      aria-pressed={checked}
    >
      {label && (
        <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-200 transition-colors tracking-wide">
          {label}
        </span>
      )}

      {/* Track */}
      <div
        className={`w-9 h-5 rounded-full transition-all duration-300 ease-spring relative shadow-inner border border-white/5 ${checked ? "bg-gradient-to-r from-gray-200 to-white border-white/50" : "bg-[#0a0a0a] border-white/10"}`}
      >
        {/* Thumb */}
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_-1px_1px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] transition-transform duration-300 ease-spring 
                ${checked ? "translate-x-4 bg-white" : "translate-x-0 bg-gray-500"}`}
        />
      </div>
    </button>
  );
});

// --- ELITE ACTION BUTTON ---
// Implements the "Holo-Tactile" press effect with gradients and double-shadows
export const ActionButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  className?: string;
}> = memo(({ onClick, children, primary, disabled, className = "" }) => {
  const baseStyle =
    "w-full py-2.5 px-4 rounded-lg font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-100 ease-out select-none disabled:opacity-50 disabled:cursor-not-allowed";

  // Tactile 3D transform logic
  const activeState = "active:translate-y-[1px] active:shadow-tactile-active active:scale-[0.99]";

  // Gradients & Shadows
  const secondaryStyle =
    "bg-[#151515] text-gray-400 border border-white/5 shadow-tactile hover:bg-[#202020] hover:text-white hover:border-white/10 hover:shadow-tactile-hover";

  const highlightedStyle =
    "bg-gradient-to-b from-gray-200 to-gray-400 text-black border-t border-white/80 border-b border-gray-500 shadow-glow-sm hover:shadow-glow-md hover:from-white hover:to-gray-300";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${activeState} ${primary ? highlightedStyle : secondaryStyle} ${className}`}
    >
      {children}
    </button>
  );
});

export const Select: React.FC<{
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}> = memo(({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-1.5 mb-2">
    <Label label={label} />
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-accent-primary appearance-none cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
));

export const ControlSection: React.FC<{
  title: string;
  icon: LucideIcon;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = memo(({ title, icon: Icon, color, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!contentRef.current) return;
    if (isOpen) {
      gsap.to(contentRef.current, {
        height: "auto",
        opacity: 1,
        duration: 0.4,
        ease: "power3.out",
      });
    } else {
      gsap.to(contentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power3.inOut",
      });
    }
  }, [isOpen]);

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden bg-[#0a0a0a] shadow-sm mb-3 transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-3 bg-gradient-to-b from-[#151515] to-[#0a0a0a] hover:from-[#1a1a1a] hover:to-[#101010] transition-all group select-none border-b border-black/20"
      >
        <div className="flex items-center gap-2.5">
          {/* Glowing Icon Container */}
          <div
            className="p-1.5 rounded-md text-black shadow-[0_2px_5px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-110 group-hover:shadow-glow-sm"
            style={{
              backgroundColor: color,
              background: `linear-gradient(135deg, ${color} 0%, #000000 150%)`,
            }}
          >
            <Icon size={12} className="text-white mix-blend-overlay" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors text-shadow-sm">
            {title}
          </span>
        </div>
        <div
          className={`text-gray-600 transition-transform duration-300 ${isOpen ? "rotate-180 text-gray-400" : "rotate-0"}`}
        >
          <Icons.ChevronDown size={14} />
        </div>
      </button>
      <div
        ref={contentRef}
        style={{
          height: defaultOpen ? "auto" : 0,
          opacity: defaultOpen ? 1 : 0,
          overflow: "hidden",
        }}
      >
        <div className="p-3 border-t border-white/5 bg-[#050505] shadow-inner">{children}</div>
      </div>
    </div>
  );
});
