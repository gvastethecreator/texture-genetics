import { describe, expect, it } from "vitest";
import { createPresetDocument, parsePresetDocument } from "@/core/state/presetFile";

describe("parsePresetDocument", () => {
  it("writes the Texture Genetics format and accepts legacy exports", () => {
    const presets = [{ id: "legacy", name: "Legacy", date: 1, state: { animate: false } }];

    expect(createPresetDocument(parsePresetDocument(presets)).format).toBe(
      "texture-genetics-presets",
    );
    expect(
      parsePresetDocument({ format: "effecttexturegen-presets", version: 1, presets }),
    ).toHaveLength(1);
  });

  it("rejects a preset whose state contains a wrong runtime type", () => {
    const document = [
      {
        id: "imported-1",
        name: "Unsafe preset",
        date: 1,
        state: { params: { intensity: "1" } },
      },
    ];

    expect(() => parsePresetDocument(document)).toThrow(
      "presets[0].state.params.intensity must be a finite number",
    );
  });

  it("rejects duplicate preset ids instead of applying an ambiguous overwrite", () => {
    const document = [
      { id: "same-id", name: "First", date: 1, state: { animate: true } },
      { id: "same-id", name: "Second", date: 2, state: { animate: false } },
    ];

    expect(() => parsePresetDocument(document)).toThrow("presets[1].id duplicates presets[0].id");
  });

  it("rejects unsupported animation enum values", () => {
    const document = [
      {
        id: "animated",
        name: "Animated",
        date: 1,
        state: {
          paramAnimations: {
            intensity: { enabled: true, type: "execute", speed: 1, min: 0, max: 1 },
          },
        },
      },
    ];

    expect(() => parsePresetDocument(document)).toThrow(
      "presets[0].state.paramAnimations.intensity.type contains an unsupported value",
    );
  });

  it.each([
    ["resolution", { resolution: 1e308 }, "resolution must be at most 4096"],
    [
      "fractional sprite columns",
      { spriteSheet: { columns: 1.5 } },
      "spriteSheet.columns must be an integer",
    ],
    [
      "negative frame count",
      { spriteSheet: { totalFrames: -1 } },
      "spriteSheet.totalFrames must be at least 1",
    ],
    [
      "excessive particle count",
      { environment: { particleCount: 1_000_000 } },
      "environment.particleCount must be at most 2000",
    ],
  ])("rejects dangerous numeric workloads: %s", (_label, state, message) => {
    expect(() => parsePresetDocument([{ id: "bounded", name: "Bounded", date: 1, state }])).toThrow(
      message,
    );
  });

  it("rejects a sprite frame count larger than its sheet capacity", () => {
    const document = [
      {
        id: "oversubscribed-sheet",
        name: "Oversubscribed",
        date: 1,
        state: { spriteSheet: { columns: 2, rows: 2, totalFrames: 5 } },
      },
    ];

    expect(() => parsePresetDocument(document)).toThrow(
      "presets[0].state.spriteSheet.totalFrames must not exceed columns x rows (4)",
    );
  });
});
