import { describe, expect, it, vi } from "vitest";
import { loadRequiredExportTextures } from "@/features/export/core/exportAssets";
import { mockAppState } from "@/__tests__/helpers";

const texture = () => ({ colorSpace: "", dispose: vi.fn() });

describe("loadRequiredExportTextures", () => {
  it("fails the export and disposes fulfilled textures when one enabled asset cannot load", async () => {
    const baseTexture = texture();
    const state = mockAppState({
      baseTexture: { ...mockAppState().baseTexture, enabled: true, texture: "base.png" },
      sticker: { ...mockAppState().sticker, enabled: true, texture: "missing.png" },
    });
    const load = vi.fn(async (url: string) => {
      if (url === "missing.png") throw new Error("decode failed");
      return baseTexture;
    });

    await expect(loadRequiredExportTextures(state, load)).rejects.toThrow(
      "Sticker texture could not be loaded: decode failed",
    );
    expect(baseTexture.dispose).toHaveBeenCalledOnce();
  });

  it("does not load assets whose feature is disabled", async () => {
    const load = vi.fn();
    await loadRequiredExportTextures(
      mockAppState({
        baseTexture: { ...mockAppState().baseTexture, enabled: false, texture: "ignored.png" },
      }),
      load,
    );

    expect(load).not.toHaveBeenCalled();
  });
});
