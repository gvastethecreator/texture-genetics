import React, { lazy, Suspense } from "react";
import { AppState } from "../../core/types/types";
import { Header } from "../ui/Header";
import { StatusBar } from "../status-bar/StatusBar";

const Controls = lazy(() =>
  import("../controls-panel/Controls").then((module) => ({ default: module.Controls })),
);
const RightControls = lazy(() =>
  import("../controls-panel/RightControls").then((module) => ({ default: module.RightControls })),
);
import type { CanvasRenderer } from "../../lib/three/rendererFactory";
import type { UserPreset } from "../../core/types/types";

type EditorActions = React.ComponentProps<typeof Header>["actions"] &
  React.ComponentProps<typeof Controls>["actions"] &
  React.ComponentProps<typeof RightControls>["actions"];

type EditorHistory = React.ComponentProps<typeof Header>["history"] &
  React.ComponentProps<typeof Controls>["history"];

interface WorkbenchLayoutProps {
  state: AppState;
  userPresets: UserPreset[];
  actions: EditorActions;
  history: EditorHistory;
  isCompactWorkbench: boolean;
  showLeft: boolean;
  showRight: boolean;
  leftPanelRef: React.RefObject<HTMLDivElement | null>;
  rightPanelRef: React.RefObject<HTMLDivElement | null>;
  onCloseInspectors: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  canvas: React.ReactNode;
  isGenerating: boolean;
  progress: number;
  activeTaskName?: string;
  renderer: CanvasRenderer | null;
  exportActions: Omit<
    React.ComponentProps<typeof RightControls>,
    "state" | "actions" | "history" | "isGenerating"
  >;
}

export const WorkbenchLayout: React.FC<WorkbenchLayoutProps> = ({
  state,
  userPresets,
  actions,
  history,
  isCompactWorkbench,
  showLeft,
  showRight,
  leftPanelRef,
  rightPanelRef,
  onCloseInspectors,
  toggleLeftPanel,
  toggleRightPanel,
  canvas,
  isGenerating,
  progress,
  activeTaskName,
  renderer,
  exportActions,
}) => (
  <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg font-sans text-gray-200">
    <Header
      state={state}
      userPresets={userPresets}
      actions={actions}
      history={history}
      toggleLeftPanel={toggleLeftPanel}
      toggleRightPanel={toggleRightPanel}
      leftPanelOpen={showLeft}
      rightPanelOpen={showRight}
    />

    <div className="relative flex h-full w-full flex-1 overflow-hidden">
      {isCompactWorkbench && (showLeft || showRight) && (
        <button
          type="button"
          aria-label="Close inspector"
          onClick={onCloseInspectors}
          className="absolute inset-0 z-30 bg-black/55 backdrop-blur-[2px] motion-reduce:backdrop-blur-none"
        />
      )}
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
          <Suspense fallback={null}>
            <Controls state={state} actions={actions} history={history} />
          </Suspense>
        </div>
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 bg-[#111216]">
        <div className="absolute inset-0 bg-[#111216]" />
        <div className="absolute inset-0 h-full w-full overflow-hidden">{canvas}</div>
        {isGenerating && (
          <div
            role="status"
            aria-live="polite"
            aria-label={`Exporting ${activeTaskName ?? "file"}, ${progress}% complete`}
            className="absolute bottom-16 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border border-accent-primary/30 bg-black/80 px-6 py-2 shadow-2xl backdrop-blur"
          >
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-accent-primary border-r-accent-primary border-b-transparent border-l-transparent" />
            <span className="font-mono text-xs font-bold text-white">
              EXPORTING {activeTaskName ? activeTaskName.toUpperCase() : "FILE"}... {progress}%
            </span>
          </div>
        )}
        <div className="absolute right-0 bottom-0 left-0 z-10">
          <StatusBar
            state={state}
            renderer={renderer}
            onToggleAnimate={() => actions.updateState({ animate: !state.animate })}
          />
        </div>
      </div>

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
          <Suspense fallback={null}>
            <RightControls
              state={state}
              actions={actions}
              history={history}
              isGenerating={isGenerating}
              {...exportActions}
            />
          </Suspense>
        </div>
      </div>
    </div>
  </div>
);
