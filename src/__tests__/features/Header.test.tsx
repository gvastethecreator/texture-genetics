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
        onShowCode={vi.fn()}
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
        onShowCode={vi.fn()}
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
        onShowCode={vi.fn()}
        toggleLeftPanel={vi.fn()}
        toggleRightPanel={vi.fn()}
        leftPanelOpen={false}
        rightPanelOpen={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Randomize texture" }));
    expect(actions.randomize).toHaveBeenCalledOnce();
  });
});
