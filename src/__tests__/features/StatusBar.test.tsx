import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { StatusBar } from "../../features/status-bar/StatusBar";
import { mockAppState } from "../helpers";

describe("StatusBar", () => {
  it("renders resolution display", () => {
    const state = mockAppState({ resolution: 1024 });
    render(<StatusBar state={state} />);
    expect(screen.getByText("1024px")).toBeInTheDocument();
  });

  it("renders export format", () => {
    const state = mockAppState();
    render(<StatusBar state={state} />);
    expect(screen.getByText("png")).toBeInTheDocument();
  });

  it("shows LIVE when animating", () => {
    const state = mockAppState({ animate: true });
    render(<StatusBar state={state} />);
    expect(screen.getByRole("button", { name: "LIVE" })).toHaveAttribute("aria-pressed", "true");
  });

  it("shows STOP when not animating", () => {
    const state = mockAppState({ animate: false });
    render(<StatusBar state={state} />);
    expect(screen.getByRole("button", { name: "STOP" })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles animation from the LIVE control", () => {
    const onToggleAnimate = vi.fn();
    render(<StatusBar state={mockAppState({ animate: true })} onToggleAnimate={onToggleAnimate} />);
    fireEvent.click(screen.getByRole("button", { name: "LIVE" }));
    expect(onToggleAnimate).toHaveBeenCalledOnce();
  });

  it("announces the current texture type in a live region", () => {
    const state = mockAppState();
    render(<StatusBar state={state} />);
    expect(document.querySelector("[aria-live='polite']")).toHaveTextContent(state.textureType);
  });

  it("displays the current texture type", () => {
    const state = mockAppState();
    render(<StatusBar state={state} />);
    expect(screen.getAllByText(state.textureType).length).toBeGreaterThan(0);
  });

  it("renders renderer status even without renderer instance", () => {
    const state = mockAppState();
    render(<StatusBar state={state} renderer={null} />);
    expect(screen.getByText("Renderer?")).toBeInTheDocument();
  });
});
