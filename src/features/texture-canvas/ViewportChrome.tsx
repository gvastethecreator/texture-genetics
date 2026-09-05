import React from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Square,
  Box,
  Circle,
  Cylinder,
  Smartphone,
  Upload,
  Palette,
  Activity,
  AlignVerticalJustifyCenter,
  Grid,
  Type,
  PenTool,
  Image,
  Sparkles,
} from "lucide-react";
import { AppState, GeometryType, ViewMode } from "../../core/types/types";
import type { CameraHandler } from "./components/CameraRig";

interface ViewportChromeProps {
  appState: AppState;
  updateState: (s: Partial<AppState>) => void;
  zoomLevel: number;
  controlsHandle: React.MutableRefObject<CameraHandler | null>;
  modelInputRef: React.RefObject<HTMLInputElement | null>;
  onModelUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ViewportChrome: React.FC<ViewportChromeProps> = ({
  appState,
  updateState,
  zoomLevel,
  controlsHandle,
  modelInputRef,
  onModelUpload,
}) => (
  <>
    {appState.geometry !== GeometryType.BACKGROUND && (
      <div className="pointer-events-none absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="pointer-events-auto mb-1 rounded border border-white/10 bg-black/60 px-2 py-1 shadow-lg backdrop-blur-md">
          <span className="font-mono text-[10px] font-bold text-accent-primary">{zoomLevel}%</span>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => controlsHandle.current?.zoomIn()}
            className="rounded-lg bg-black/50 p-2 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => controlsHandle.current?.zoomOut()}
            className="rounded-lg bg-black/50 p-2 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            aria-label="Reset view"
            onClick={() => controlsHandle.current?.reset()}
            className="rounded-lg bg-black/50 p-2 text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
            title="Reset View"
          >
            <Maximize size={16} />
          </button>
        </div>
        <div className="pointer-events-auto mt-2 flex flex-col gap-2">
          {(
            [
              ["top", "TOP", "Top View"],
              ["front", "FRT", "Front View"],
              ["left", "LFT", "Left View"],
              ["right", "RGT", "Right View"],
              ["back", "BCK", "Back View"],
              ["isometric", "ISO", "Isometric View"],
            ] as const
          ).map(([view, label, title]) => (
            <button
              key={view}
              type="button"
              aria-label={title}
              onClick={() => controlsHandle.current?.setView(view)}
              className="rounded-lg bg-black/50 p-2 font-mono text-[10px] font-bold text-white shadow-lg backdrop-blur-sm transition-all hover:bg-black/80 active:scale-95"
              title={title}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    )}

    <div className="absolute right-4 bottom-14 z-10 flex gap-1 rounded-lg border border-white/5 bg-black/40 p-1 backdrop-blur-md">
      {(
        [
          { mode: ViewMode.ALBEDO, icon: Palette, label: "Albedo" },
          { mode: ViewMode.NORMAL, icon: Activity, label: "Normal" },
          { mode: ViewMode.HEIGHT, icon: AlignVerticalJustifyCenter, label: "Height" },
          { mode: ViewMode.UV, icon: Grid, label: "UV" },
          { mode: ViewMode.RENDER, icon: Sparkles, label: "Render" },
        ] as const
      ).map((item) => (
        <button
          key={item.mode}
          type="button"
          aria-label={item.label}
          aria-pressed={appState.viewMode === item.mode}
          onClick={() => updateState({ viewMode: item.mode })}
          className={`rounded p-1.5 transition-all ${appState.viewMode === item.mode ? "bg-white text-black shadow-sm" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
          title={item.label}
        >
          <item.icon size={14} />
        </button>
      ))}
    </div>

    <div className="absolute bottom-14 left-4 z-10 flex gap-1 rounded-lg border border-white/5 bg-black/40 p-1 backdrop-blur-md">
      {(
        [
          { type: GeometryType.BACKGROUND, icon: Image, label: "Background" },
          { type: GeometryType.PLANE, icon: Square, label: "Plane" },
          { type: GeometryType.CUBE, icon: Box, label: "Cube" },
          { type: GeometryType.SPHERE, icon: Circle, label: "Sphere" },
          { type: GeometryType.CYLINDER, icon: Cylinder, label: "Cylinder" },
          { type: GeometryType.CARD, icon: Smartphone, label: "Card" },
          { type: GeometryType.SVG, icon: PenTool, label: "SVG" },
          { type: GeometryType.TEXT, icon: Type, label: "Text" },
        ] as const
      ).map((item) => (
        <button
          key={item.type}
          type="button"
          aria-label={item.label}
          aria-pressed={appState.geometry === item.type}
          onClick={() => updateState({ geometry: item.type })}
          className={`rounded p-1.5 transition-all ${appState.geometry === item.type ? "bg-white text-black shadow-sm" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
          title={item.type}
        >
          <item.icon size={14} />
        </button>
      ))}
      <div className="mx-1 h-4 w-px self-center bg-white/20" />
      <input
        type="file"
        ref={modelInputRef}
        onChange={onModelUpload}
        accept=".obj,.gltf,.glb,.svg"
        className="hidden"
      />
      <button
        type="button"
        aria-label="Upload custom model"
        onClick={() => modelInputRef.current?.click()}
        className={`rounded p-1.5 transition-all ${appState.geometry === GeometryType.CUSTOM ? "bg-white text-black shadow-sm" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}
        title="Upload Custom Model"
      >
        <Upload size={14} />
      </button>
    </div>
  </>
);
