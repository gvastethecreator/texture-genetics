import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../../features/ui/Header";
import { mockAppState, mockHistory, mockHeaderActions } from "../helpers";

describe("Header", () => {
  it("renders the app logo/title", () => {
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={mockHeaderActions()}
        history={mockHistory()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    expect(screen.getByText("Texture Genetics")).toBeInTheDocument();
  });

  it("calls toggleLeftPanel when sidebar toggle clicked", () => {
    const toggleLeft = vi.fn();
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={mockHeaderActions()}
        history={mockHistory()}
        toggleLeftPanel={toggleLeft}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open texture tools" }));
    expect(toggleLeft).toHaveBeenCalledOnce();
  });

  it("calls randomize when randomize button is clicked", () => {
    const actions = mockHeaderActions();
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={actions}
        history={mockHistory()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Randomize texture" }));
    expect(actions.randomize).toHaveBeenCalledOnce();
  });

  it("does not reset when the confirm dialog is cancelled", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    const actions = mockHeaderActions();
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={actions}
        history={mockHistory()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset all settings" }));
    expect(actions.resetState).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it("resets and toasts after confirm", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    const actions = mockHeaderActions();
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={actions}
        history={mockHistory()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Reset all settings" }));
    expect(actions.resetState).toHaveBeenCalledOnce();
    expect(actions.addToast).toHaveBeenCalledWith("info", "Reset to defaults — Undo with Ctrl/⌘+Z");
    confirmSpy.mockRestore();
  });

  it("saves a named preset from the prompt", async () => {
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("My Look");
    const actions = mockHeaderActions();
    render(
      <Header
        state={mockAppState()}
        userPresets={[]}
        actions={actions}
        history={mockHistory()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Save preset" }));
    expect(actions.saveUserPreset).toHaveBeenCalledWith("My Look");
    promptSpy.mockRestore();
  });
});
