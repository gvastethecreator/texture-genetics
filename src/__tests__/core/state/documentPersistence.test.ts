import { describe, expect, it } from "vitest";
import {
  assetFingerprint,
  parseStoredDocument,
  serializePersistedDocument,
} from "@/core/state/documentPersistence";
import { createDefaultAppState } from "@/core/state/defaultState";
import { mockAppState } from "@/__tests__/helpers";

describe("documentPersistence", () => {
  it("omits session UI from serialized JSON", () => {
    const serialized = serializePersistedDocument(
      mockAppState({ isSettingsOpen: true, isFullscreen: true, animate: true }),
      "rev-1",
    );
    expect(serialized).not.toHaveProperty("isSettingsOpen");
    expect(serialized).not.toHaveProperty("isFullscreen");
    expect(serialized.animate).toBe(true);
    expect(serialized._assetRevision).toBe("rev-1");
  });

  it("merges a partial stored document onto defaults", () => {
    const { document } = parseStoredDocument(
      createDefaultAppState(),
      JSON.stringify({ params: { scale: 2 }, _version: 4, _assetRevision: "abc" }),
    );
    expect(document.params.scale).toBe(2);
    expect(document.params.p3).toBe(createDefaultAppState().params.p3);
  });

  it("fingerprints heavy assets independently of params", () => {
    const withTexture = mockAppState({
      baseTexture: { ...mockAppState().baseTexture, texture: "blob:one" },
    });
    const paramOnly = mockAppState({
      baseTexture: { ...mockAppState().baseTexture, texture: "blob:one" },
      params: { ...mockAppState().params, scale: 9 },
    });
    expect(assetFingerprint(withTexture)).toBe(assetFingerprint(paramOnly));
  });
});
