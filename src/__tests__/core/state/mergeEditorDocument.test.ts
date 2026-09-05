import { describe, expect, it } from "vitest";
import {
  mergeEditorDocument,
  mergeEditorDocumentFromDefaults,
} from "@/core/state/mergeEditorDocument";
import { createDefaultAppState } from "@/core/state/defaultState";
import { mockAppState } from "@/__tests__/helpers";
import type { AppState } from "@/core/types/types";

describe("mergeEditorDocument", () => {
  it("keeps default palette and p1-p15 when only scale is patched", () => {
    const merged = mergeEditorDocumentFromDefaults({
      params: { scale: 2 } as AppState["params"],
    });
    const defaults = createDefaultAppState();
    expect(merged.params.scale).toBe(2);
    expect(merged.params.p1).toBe(defaults.params.p1);
    expect(merged.params.palette).toHaveLength(defaults.params.palette.length);
  });

  it("keeps live session flags when merging a stored document", () => {
    const live = mockAppState({ isSettingsOpen: true });
    const merged = mergeEditorDocument(live, { animate: false, isSettingsOpen: false });
    expect(merged.animate).toBe(false);
    expect(merged.isSettingsOpen).toBe(true);
  });
});
