import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Box } from "lucide-react";
import { ControlSection, Label, Slider, Toggle } from "../../../shared/ui/Elements";

describe("shared control accessibility", () => {
  it("removes collapsed controls from the focus and accessibility trees", () => {
    render(
      <ControlSection title="Material" icon={Box} color="#fff">
        <button type="button">Nested control</button>
      </ControlSection>,
    );

    const disclosure = screen.getByRole("button", { name: /material/i });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("button", { name: "Nested control" })).not.toBeInTheDocument();

    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Nested control" })).toBeInTheDocument();

    fireEvent.click(disclosure);
    expect(screen.queryByRole("button", { name: "Nested control" })).not.toBeInTheDocument();
  });

  it("gives range, precise value and unlabeled toggle meaningful names", () => {
    render(
      <div>
        <Label label="Global rotation" />
        <Slider min={0} max={360} value={45} onChange={vi.fn()} />
        <Toggle label="" checked={false} onChange={vi.fn()} />
      </div>,
    );

    expect(screen.getByRole("slider", { name: "Global rotation" })).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Global rotation, precise value" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enable parameter animation" })).toBeInTheDocument();
  });
});
