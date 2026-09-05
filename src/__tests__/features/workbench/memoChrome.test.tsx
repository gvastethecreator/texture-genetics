import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTextureEditor } from "@/core/state/useTextureEditor";
import { useExportManager } from "@/features/export/useExportManager";
import { ExportPanel } from "@/features/controls-panel/components/ExportPanel";
import { Header } from "@/features/ui/Header";

vi.mock("idb-keyval", () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
  del: vi.fn().mockResolvedValue(undefined),
}));

const toggleLeftPanel = () => {};
const toggleRightPanel = () => {};

const installMemoRenderCounter = (component: object) => {
  const memo = component as { type: (...args: never[]) => unknown };
  const original = memo.type;
  if (typeof original !== "function") {
    throw new Error("expected a React.memo component");
  }
  const spy = vi.fn(original);
  Object.assign(memo, { type: spy });
  return {
    spy,
    restore: () => {
      Object.assign(memo, { type: original });
    },
  };
};

describe("Header and ExportPanel memo path", () => {
  let headerCounter: ReturnType<typeof installMemoRenderCounter>;
  let exportCounter: ReturnType<typeof installMemoRenderCounter>;

  beforeEach(() => {
    headerCounter = installMemoRenderCounter(Header);
    exportCounter = installMemoRenderCounter(ExportPanel);
  });

  afterEach(() => {
    headerCounter.restore();
    exportCounter.restore();
  });

  it("skips param-only rerenders and undoes the skipped commit", async () => {
    const api = {
      updateParams: (_partial: { scale: number }) => {},
      commit: () => {},
      scale: () => 0,
    };

    function Harness() {
      const editor = useTextureEditor();
      const exported = useExportManager(editor.state, {});
      api.updateParams = (partial) => editor.actions.updateParams(partial);
      api.commit = editor.history.commit;
      api.scale = () => editor.state.params.scale;

      return (
        <>
          <Header
            state={editor.state}
            userPresets={editor.userPresets}
            actions={editor.actions}
            history={editor.history}
            toggleLeftPanel={toggleLeftPanel}
            toggleRightPanel={toggleRightPanel}
            leftPanelOpen={false}
            rightPanelOpen={false}
          />
          <ExportPanel
            state={editor.state}
            updateStateGroup={editor.actions.patchGroup}
            onSpriteSheet={exported.generateSpriteSheet}
            onGifExport={exported.generateGif}
            onVideoRecord={exported.recordVideo}
            onHtmlExport={exported.generateHtml}
            onGlbExport={exported.generateGlb}
            isGenerating={exported.isGenerating}
            onCommit={editor.history.commit}
            onDownload={exported.generateHighResImage}
            onChangeState={editor.actions.updateState}
            exportPresets={editor.actions.exportPresets}
            importPresets={editor.actions.importPresets}
            onDownloadZip={exported.downloadAllMaps}
          />
        </>
      );
    }

    render(<Harness />);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    });

    act(() => {
      api.commit();
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Undo" })).toBeEnabled();
    });

    const headerRenders = headerCounter.spy.mock.calls.length;
    const exportRenders = exportCounter.spy.mock.calls.length;
    expect(headerRenders).toBeGreaterThan(0);
    expect(exportRenders).toBeGreaterThan(0);

    act(() => {
      api.updateParams({ scale: 2.25 });
    });
    expect(headerCounter.spy.mock.calls.length).toBe(headerRenders);
    expect(exportCounter.spy.mock.calls.length).toBe(exportRenders);

    act(() => {
      api.commit();
    });
    expect(headerCounter.spy.mock.calls.length).toBe(headerRenders);
    expect(exportCounter.spy.mock.calls.length).toBe(exportRenders);

    act(() => {
      api.updateParams({ scale: 3.5 });
    });
    expect(headerCounter.spy.mock.calls.length).toBe(headerRenders);
    expect(exportCounter.spy.mock.calls.length).toBe(exportRenders);

    act(() => {
      api.commit();
    });
    expect(headerCounter.spy.mock.calls.length).toBe(headerRenders);
    expect(exportCounter.spy.mock.calls.length).toBe(exportRenders);
    expect(api.scale()).toBe(3.5);

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(api.scale()).toBe(2.25);
  });
});
