import { describe, expect, it } from "vitest";
import { classifyUserFile } from "@/shared/utils/fileLoaders";
import { catalogTextureTypes } from "@/core/logic/randomizer";
import { PATTERN_MANIFEST } from "@/data/patternManifest";

describe("classifyUserFile", () => {
  it("classifies json, images, models, and unknown files", () => {
    expect(classifyUserFile(new File([], "look.json"))).toBe("json");
    expect(classifyUserFile(new File([], "albedo.png", { type: "image/png" }))).toBe("image");
    expect(classifyUserFile(new File([], "mesh.glb"))).toBe("model");
    expect(classifyUserFile(new File([], "notes.txt"))).toBe("unknown");
  });
});

describe("catalogTextureTypes", () => {
  it("matches PATTERN_MANIFEST", () => {
    expect(catalogTextureTypes()).toEqual(PATTERN_MANIFEST.map((entry) => entry.type));
  });
});
