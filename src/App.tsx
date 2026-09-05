import { useState, useRef, useEffect, lazy, Suspense, useCallback } from "react";

// Validate and register the complete cross-renderer pattern catalog at startup.
import "./data/patternManifest";
import { createShortcutKeyMap } from "./core/commands";
import { useTextureEditor } from "./core/state/useTextureEditor";
import { useExportManager } from "./features/export/useExportManager";
import { useHotkeys } from "./shared/hooks/useHotkeys";
import { matchesMediaQuery, useMediaQuery } from "./shared/hooks/useMediaQuery";
import { useModalFocus } from "./shared/hooks/useModalFocus";

import { TextureCanvas } from "./features/texture-canvas/TextureCanvas";
import type { CanvasRenderer } from "./lib/three/rendererFactory";
import { DragDropOverlay } from "./shared/ui/DragDropOverlay";
import { ToastContainer } from "./shared/ui/Toast";
import { ErrorBoundary } from "./shared/components/ErrorBoundary";
import { collectStateObjectUrls, syncLiveObjectUrls } from "./shared/utils/objectUrls";
import { ingestUserFile } from "./shared/utils/ingest";
import { WorkbenchLayout } from "./features/workbench/WorkbenchLayout";

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
    activeTaskName,
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
    syncLiveObjectUrls(ownedObjectUrlsRef.current, currentUrls);
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

  const handleDropJson = (file: File) => actions.importPresets(file);
  const handleDropImage = (file: File) => {
    const outcome = ingestUserFile(file, state);
    if (outcome.ok && outcome.patch && Object.keys(outcome.patch).length > 0) {
      actions.updateState(outcome.patch);
    }
    actions.addToast(outcome.toast.type, outcome.toast.message);
  };
  const handleDropUnknown = (file: File) => {
    const outcome = ingestUserFile(file, state);
    actions.addToast(outcome.toast.type, outcome.toast.message);
  };

  const canvas = (
    <ErrorBoundary>
      <TextureCanvas appState={state} setGlRef={setGl} updateState={actions.updateState} />
    </ErrorBoundary>
  );

  if (state.isFullscreen) {
    return (
      <ErrorBoundary>
        <div className="fixed inset-0 z-50 h-full w-full bg-black">
          {canvas}
          <div className="pointer-events-auto absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              aria-label={state.animate ? "Pause animation" : "Play animation"}
              onClick={() => actions.updateState({ animate: !state.animate })}
              className="rounded border border-white/10 bg-black/50 p-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20"
            >
              {state.animate ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              aria-label="Undo"
              onClick={history.undo}
              disabled={!history.canUndo}
              className="rounded border border-white/10 bg-black/50 p-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20 disabled:opacity-35"
            >
              Undo
            </button>
            <button
              type="button"
              aria-label="Keyboard shortcuts"
              onClick={() => actions.updateState({ isShortcutsOpen: true, isFullscreen: false })}
              className="rounded border border-white/10 bg-black/50 p-2 text-xs font-bold text-white backdrop-blur-md hover:bg-white/20"
            >
              Shortcuts
            </button>
            <button
              type="button"
              aria-label="Exit fullscreen"
              onClick={() => actions.updateState({ isFullscreen: false })}
              className="rounded border border-white/10 bg-black/50 p-2 text-white backdrop-blur-md hover:bg-white/20"
            >
              Exit Fullscreen (ESC)
            </button>
          </div>
          <ToastContainer toasts={toasts} onRemove={actions.removeToast} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div ref={appContainerRef}>
        <WorkbenchLayout
          state={state}
          userPresets={userPresets}
          actions={actions}
          history={history}
          isCompactWorkbench={isCompactWorkbench}
          showLeft={showLeft}
          showRight={showRight}
          leftPanelRef={leftPanelRef}
          rightPanelRef={rightPanelRef}
          onCloseInspectors={closeCompactPanels}
          toggleLeftPanel={toggleLeftPanel}
          toggleRightPanel={toggleRightPanel}
          canvas={canvas}
          isGenerating={isGenerating}
          progress={progress}
          activeTaskName={activeTaskName ?? undefined}
          renderer={gl}
          exportActions={{
            onDownload: generateHighResImage,
            onSpriteSheet: generateSpriteSheet,
            onGifExport: generateGif,
            onVideoRecord: recordVideo,
            onHtmlExport: generateHtml,
            onGlbExport: generateGlb,
            onDownloadZip: downloadAllMaps,
          }}
        />

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

        <DragDropOverlay
          onDropJson={handleDropJson}
          onDropImage={handleDropImage}
          onDropUnknown={handleDropUnknown}
        />

        <ToastContainer toasts={toasts} onRemove={actions.removeToast} />
      </div>
    </ErrorBoundary>
  );
}
