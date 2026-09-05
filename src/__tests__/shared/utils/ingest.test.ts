import { describe, expect, it, vi } from "vitest";
import { ingestUserFile } from "@/shared/utils/ingest";
import { GeometryType } from "@/core/types/types";
import { mockAppState } from "@/__tests__/helpers";

describe("ingestUserFile", () => {
  it("loads png as a base texture blob URL", () => {
    const createObjectURL = vi.fn(() => "blob:base");
    const outcome = ingestUserFile(
      new File(["x"], "albedo.png", { type: "image/png" }),
      mockAppState(),
      {
        createObjectURL,
      },
    );
    expect(outcome.ok).toBe(true);
    expect(outcome.patch?.baseTexture?.texture).toBe("blob:base");
    expect(outcome.patch?.baseTexture?.enabled).toBe(true);
  });

  it("loads glb as custom geometry", () => {
    const createObjectURL = vi.fn(() => "blob:model");
    const outcome = ingestUserFile(new File(["x"], "mesh.glb"), mockAppState(), {
      createObjectURL,
    });
    expect(outcome.ok).toBe(true);
    expect(outcome.patch?.geometry).toBe(GeometryType.CUSTOM);
    expect(outcome.patch?.customModel).toBe("blob:model");
  });

  it("rejects unknown files and lists accepted kinds", () => {
    const outcome = ingestUserFile(new File(["x"], "notes.txt"), mockAppState());
    expect(outcome.ok).toBe(false);
    expect(outcome.toast.message).toMatch(/JSON/);
  });
});
