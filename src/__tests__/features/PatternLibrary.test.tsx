import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PatternLibrary } from "@/features/controls-panel/components/PatternLibrary";
import { TextureType } from "@/core/types/types";

describe("PatternLibrary", () => {
  it("filters patterns by name", () => {
    render(
      <PatternLibrary
        currentType={TextureType.PERLIN_NOISE}
        onSelect={vi.fn()}
        onRandom={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Filter patterns" }), {
      target: { value: "Perlin" },
    });
    expect(screen.getByRole("button", { name: TextureType.PERLIN_NOISE })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: TextureType.CHECKER })).not.toBeInTheDocument();
  });
});
