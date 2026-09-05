import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ViewportChrome } from "@/features/texture-canvas/ViewportChrome";
import { GeometryType, ViewMode } from "@/core/types/types";
import { mockAppState } from "@/__tests__/helpers";

describe("ViewportChrome", () => {
  it("changes view mode and geometry from toolbar buttons", () => {
    const updateState = vi.fn();
    render(
      <ViewportChrome
        appState={mockAppState({ geometry: GeometryType.CUBE })}
        updateState={updateState}
        zoomLevel={100}
        controlsHandle={{ current: null }}
        modelInputRef={{ current: null }}
        onModelUpload={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Normal" }));
    expect(updateState).toHaveBeenCalledWith({ viewMode: ViewMode.NORMAL });
    fireEvent.click(screen.getByRole("button", { name: "Sphere" }));
    expect(updateState).toHaveBeenCalledWith({ geometry: GeometryType.SPHERE });
  });
});
