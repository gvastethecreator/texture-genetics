import React, { useState, useRef, useEffect, lazy, Suspense, useCallback } from "react";

// Validate and register the complete cross-renderer pattern catalog at startup.
import "./data/patternManifest";
import { GeometryType } from "./core/types/types";
import { createShortcutKeyMap } from "./core/commands";
import { useTextureEditor } from "./core/state/useTextureEditor";
import { useExportManager } from "./features/export/useExportManager";
import { useHotkeys } from "./shared/hooks/useHotkeys";
import { matchesMediaQuery, useMediaQuery } from "./shared/hooks/useMediaQuery";
import { useModalFocus } from "./shared/hooks/useModalFocus";

// Eager components (always visible)
import { Header } from "./features/ui/Header";
import { Controls } from "./features/controls-panel/Controls";
import { RightControls } from "./features/controls-panel/RightControls";
import { TextureCanvas } from "./features/texture-canvas/TextureCanvas";
import type { CanvasRenderer } from "./lib/three/rendererFactory";
import { StatusBar } from "./features/status-bar/StatusBar";
import { DragDropOverlay } from "./shared/ui/DragDropOverlay";
import { ToastContainer } from "./shared/ui/Toast";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { collectStateObjectUrls, revokeReplacedObjectUrls } from "./shared/utils/objectUrls";

// Lazy-loaded modals (loaded on demand)
const SettingsModal = lazy(() =>
  import("./features/settings-modal/SettingsModal").then((m) => ({ default: m.SettingsModal })),
);
const CodeViewerModal = lazy(() =>
  import("./features/ui/CodeViewerModal").then((m) => ({ default: m.CodeViewerModal })),
);
const ShortcutsModal = lazy(() =>
  import("./features/ui/ShortcutsModal").then((m) => ({ default: m.ShortcutsModal })),
);

export default function App() {
  const { state, history, actions, userPresets, toasts } = useTextureEditor();

  // New Modular Export Hook
  const {
    isGenerating,
    progress,
    generateSpriteSheet,
    generateGif,
    generateHighResImage,
    downloadAllMaps,
    recordVideo,
    generateHtml,
    generateGlb,
  } = useExportManager(state, {
    onSuccess: (msg) => actions.addToast("success", msg),
    onError: (msg) => actions.addToast("error", msg),
  });

  const [gl, setGl] = useState<CanvasRenderer | null>(null);

  // Layout State
  const isCompactWorkbench = useMediaQuery("(max-width: 1279px)");
  const [showLeft, setShowLeft] = useState(() => !matchesMediaQuery("(max-width: 1279px)"));
  const [showRight, setShowRight] = useState(() => !matchesMediaQuery("(max-width: 1279px)"));
  const ownedObjectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentUrls = collectStateObjectUrls(state);
    revokeReplacedObjectUrls(ownedObjectUrlsRef.current, currentUrls);
    ownedObjectUrlsRef.current = currentUrls;
  }, [
    state.baseTexture.texture,
    state.sticker.texture,
    state.imageAlpha.maskTexture,
    state.customModel,
    state.svg.url,
  ]);

  const appContainerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setShowLeft(!isCompactWorkbench);
    setShowRight(!isCompactWorkbench);
  }, [isCompactWorkbench]);

  const closeCompactPanels = useCallback(() => {
    if (!isCompactWorkbench) return;
    setShowLeft(false);
    setShowRight(false);
  }, [isCompactWorkbench]);

  const toggleLeftPanel = useCallback(() => {
    setShowLeft((current) => !current);
    if (isCompactWorkbench) setShowRight(false);
  }, [isCompactWorkbench]);

  const toggleRightPanel = useCallback(() => {
    setShowRight((current) => !current);
    if (isCompactWorkbench) setShowLeft(false);
  }, [isCompactWorkbench]);

  const toggleWorkbenchPanels = useCallback(() => {
    if (showLeft || showRight) {
      setShowLeft(false);
      setShowRight(false);
      return;
    }
    setShowLeft(true);
    setShowRight(!isCompactWorkbench);
  }, [isCompactWorkbench, showLeft, showRight]);

  useModalFocus({
    isOpen: isCompactWorkbench && showLeft,
    containerRef: leftPanelRef,
    onClose: closeCompactPanels,
  });
  useModalFocus({
    isOpen: isCompactWorkbench && showRight,
    containerRef: rightPanelRef,
    onClose: closeCompactPanels,
  });

  // Hotkeys
  useHotkeys(
    createShortcutKeyMap({
      undo: history.undo,
      redo: history.redo,
      "toggle-animation": () => {
        if (!state.isSettingsOpen && !state.isCodeOpen && !state.isShortcutsOpen) {
          actions.updateState({ animate: !state.animate });
        }
      },
      randomize: actions.randomize,
      "toggle-panels": toggleWorkbenchPanels,
      "show-shortcuts": () => actions.updateState({ isShortcutsOpen: true }),
      "exit-fullscreen": state.isFullscreen
        ? () => actions.updateState({ isFullscreen: false })
        : undefined,
    }),
  );

  // Drag & Drop
  const handleDropJson = (file: File) => actions.importPresets(file);
  const handleDropImage = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".obj") || name.endsWith(".gltf") || name.endsWith(".glb")) {
      const url = URL.createObjectURL(file);
      actions.updateState({
        geometry: GeometryType.CUSTOM,
        customModel: url,
      });
    } else {
      // Texture
      const reader = new FileReader();
      const handleLoad = (e: ProgressEvent<FileReader>) => {
        actions.updateState({
          baseTexture: {
            ...state.baseTexture,
            enabled: true,
            texture: e.target?.result as string,
          },
        });
        actions.addToast("success", "Base Texture Loaded");
      };
      reader.addEventListener("load", handleLoad, { once: true });
      reader.readAsDataURL(file);
    }
  };

  if (state.isFullscreen) {
    return (
      <ErrorBoundary>
        <div className="fixed inset-0 z-50 bg-black w-full h-full">
          <TextureCanvas appState={state} setGlRef={setGl} updateState={actions.updateState} />
          <button
            type="button"
            aria-label="Exit fullscreen"
            onClick={() => actions.updateState({ isFullscreen: false })}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded hover:bg-white/20 pointer-events-auto backdrop-blur-md border border-white/10"
          >
            Exit Fullscreen (ESC)
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        ref={appContainerRef}
        className="flex flex-col h-screen w-screen bg-bg text-gray-200 overflow-hidden font-sans"
      >
        {/* HEADER */}
        <Header
          state={state}
          userPresets={userPresets}
          actions={actions}
          history={history}
          onShowCode={() => actions.updateState({ isCodeOpen: true })}
          toggleLeftPanel={toggleLeftPanel}
          toggleRightPanel={toggleRightPanel}
          leftPanelOpen={showLeft}
          rightPanelOpen={showRight}
        />

        {/* MAIN CONTENT */}
        <div className="flex-1 flex overflow-hidden relative w-full h-full">
          {isCompactWorkbench && (showLeft || showRight) && (
            <button
              type="button"
              aria-label="Close inspector"
              onClick={closeCompactPanels}
              className="absolute inset-0 z-30 bg-black/55 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
            />
          )}
          {/* LEFT PANEL (Controls) */}
          <div
            ref={leftPanelRef}
            id="texture-tools-panel"
            role={isCompactWorkbench ? "dialog" : undefined}
            aria-modal={isCompactWorkbench ? true : undefined}
            aria-label="Texture tools"
            tabIndex={isCompactWorkbench ? -1 : undefined}
            aria-hidden={!showLeft}
            inert={!showLeft}
            className={`${isCompactWorkbench ? "absolute inset-y-0 left-0 z-40 w-[min(20rem,calc(100vw-3rem))] shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none" : `relative z-20 shrink-0 ${showLeft ? "w-80" : "w-0"}`} ${showLeft ? "translate-x-0" : "-translate-x-full"} overflow-hidden border-r border-border bg-panel`}
          >
            <div className="h-full w-full min-w-80 overflow-hidden">
              <Controls state={state} actions={actions} history={history} />
            </div>
          </div>

          {/* CENTER (Canvas) - ABSOLUTE POSITIONING STRATEGY */}
          <div className="flex-1 relative min-w-0 min-h-0 bg-[#111216]">
            {/* Fallback diagnostic background - If you see Blue/Gray, Canvas is transparent/missing. If Black, Canvas is working but scene is dark. */}
            <div className="absolute inset-0 bg-[#111216]" />

            {/* Canvas Container forced to fill */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              <ErrorBoundary>
                <TextureCanvas
                  appState={state}
                  setGlRef={setGl}
                  updateState={actions.updateState}
                />
              </ErrorBoundary>
            </div>

            {/* Progress Bar for Exporting */}
            {isGenerating && (
              <div
                role="status"
                aria-live="polite"
                aria-label={`Exporting, ${progress}% complete`}
                className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-black/80 backdrop-blur border border-accent-primary/30 rounded-full px-6 py-2 flex items-center gap-3 shadow-2xl"
              >
                <div className="w-4 h-4 border-2 border-t-accent-primary border-r-accent-primary border-b-transparent border-l-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono font-bold text-white">
                  EXPORTING... {progress}%
                </span>
              </div>
            )}

            {/* Floating Status Bar inside Canvas area at bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
              <StatusBar state={state} renderer={gl} />
            </div>
          </div>

          {/* RIGHT PANEL (Export/Env) */}
          <div
            ref={rightPanelRef}
            id="output-inspector-panel"
            role={isCompactWorkbench ? "dialog" : undefined}
            aria-modal={isCompactWorkbench ? true : undefined}
            aria-label="Output and scene inspector"
            tabIndex={isCompactWorkbench ? -1 : undefined}
            aria-hidden={!showRight}
            inert={!showRight}
            className={`${isCompactWorkbench ? "absolute inset-y-0 right-0 z-40 w-[min(22rem,calc(100vw-3rem))] shadow-2xl transition-transform duration-200 ease-out motion-reduce:transition-none" : `relative z-20 shrink-0 ${showRight ? "w-72" : "w-0"}`} ${showRight ? "translate-x-0" : "translate-x-full"} overflow-hidden border-l border-border bg-panel`}
          >
            <div className="h-full w-full min-w-72 overflow-hidden">
              <RightControls
                state={state}
                actions={actions}
                history={history}
                onDownload={generateHighResImage}
                onSpriteSheet={generateSpriteSheet}
                onGifExport={generateGif}
                onVideoRecord={recordVideo}
                onHtmlExport={generateHtml}
                onGlbExport={generateGlb}
                isGenerating={isGenerating}
                onDownloadZip={downloadAllMaps}
              />
            </div>
          </div>
        </div>

        {/* MODALS & OVERLAYS (lazy-loaded) */}
        <Suspense fallback={null}>
          {state.isSettingsOpen && (
            <SettingsModal
              isOpen={state.isSettingsOpen}
              onClose={() => actions.updateState({ isSettingsOpen: false })}
              state={state}
              updateState={actions.updateState}
              updateSettings={(s) => actions.updateState({ settings: { ...state.settings, ...s } })}
            />
          )}

          {state.isCodeOpen && (
            <CodeViewerModal
              isOpen={state.isCodeOpen}
              onClose={() => actions.updateState({ isCodeOpen: false })}
              state={state}
            />
          )}

          {state.isShortcutsOpen && (
            <ShortcutsModal
              isOpen={state.isShortcutsOpen}
              onClose={() => actions.updateState({ isShortcutsOpen: false })}
            />
          )}
        </Suspense>

        <DragDropOverlay onDropJson={handleDropJson} onDropImage={handleDropImage} />

        <ToastContainer toasts={toasts} onRemove={actions.removeToast} />
      </div>
    </ErrorBoundary>
  );
}
