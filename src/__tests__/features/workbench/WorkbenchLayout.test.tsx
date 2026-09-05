import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WorkbenchLayout } from "@/features/workbench/WorkbenchLayout";
import { mockAppState, mockHeaderActions, mockHistory } from "@/__tests__/helpers";

describe("WorkbenchLayout", () => {
  it("closes compact inspectors from the overlay", () => {
    const onCloseInspectors = vi.fn();
    render(
      <WorkbenchLayout
        state={mockAppState()}
        userPresets={[]}
        actions={mockHeaderActions() as never}
        history={{ ...mockHistory(), commit: vi.fn() }}
        isCompactWorkbench
        showLeft
        showRight={false}
        leftPanelRef={{ current: null }}
        rightPanelRef={{ current: null }}
        onCloseInspectors={onCloseInspectors}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        canvas={<div>canvas</div>}
        isGenerating={false}
        progress={0}
        renderer={null}
        exportActions={{
          onDownload: vi.fn(),
          onSpriteSheet: vi.fn(),
          onGifExport: vi.fn(),
          onHtmlExport: vi.fn(),
          onGlbExport: vi.fn(),
          onDownloadZip: vi.fn(),
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close inspector" }));
    expect(onCloseInspectors).toHaveBeenCalledOnce();
  });

  it("names the active export task", () => {
    render(
      <WorkbenchLayout
        state={mockAppState()}
        userPresets={[]}
        actions={mockHeaderActions() as never}
        history={{ ...mockHistory(), commit: vi.fn() }}
        isCompactWorkbench={false}
        showLeft
        showRight
        leftPanelRef={{ current: null }}
        rightPanelRef={{ current: null }}
        onCloseInspectors={vi.fn()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        canvas={<div>canvas</div>}
        isGenerating
        progress={40}
        activeTaskName="GIF"
        renderer={null}
        exportActions={{
          onDownload: vi.fn(),
          onSpriteSheet: vi.fn(),
          onGifExport: vi.fn(),
          onHtmlExport: vi.fn(),
          onGlbExport: vi.fn(),
          onDownloadZip: vi.fn(),
        }}
      />,
    );
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Exporting GIF, 40% complete");
  });
});
