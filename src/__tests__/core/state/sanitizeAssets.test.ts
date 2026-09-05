import { describe, expect, it } from "vitest";
import { sanitizeNestedAssets, sanitizeStateAssets } from "@/core/state/sanitizeAssets";
import { mockAppState } from "@/__tests__/helpers";

describe("sanitizeNestedAssets", () => {
  it("keeps sibling sticker fields when texture is invalid", () => {
    const current = mockAppState().sticker;
    const merged = sanitizeNestedAssets("sticker", current, {
      scale: 2,
      texture: { not: "a string" } as unknown as string,
    });
    expect(merged.scale).toBe(2);
    expect(merged.texture).toBeNull();
  });

  it("sanitizes nested textures on a full state patch", () => {
    const prev = mockAppState();
    const next = sanitizeStateAssets(prev, {
      sticker: { ...prev.sticker, texture: 12 as unknown as string },
    });
    expect(next.sticker.texture).toBeNull();
  });
});
