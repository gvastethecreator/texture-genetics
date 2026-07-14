import { describe, expect, it, vi } from "vitest";
import { generateGlb } from "@/features/export/strategies/glbStrategy";
import { GeometryType } from "@/core/types/types";
import { mockAppState } from "@/__tests__/helpers";

describe("generateGlb", () => {
  it.each([GeometryType.CUSTOM, GeometryType.SVG, GeometryType.TEXT])(
    "rejects unsupported %s geometry instead of exporting a substitute plane",
    async (geometry) => {
      await expect(generateGlb(mockAppState({ geometry }), vi.fn())).rejects.toThrow(
        `GLB export does not support ${geometry} geometry yet; select a built-in mesh`,
      );
    },
  );
});
