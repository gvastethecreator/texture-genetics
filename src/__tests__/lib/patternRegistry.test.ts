import { describe, expect, it } from "vitest";
import { TextureType } from "../../core/types/types";
import { TEXTURE_CATEGORIES, SHADER_LABELS } from "../../data/textureData";
import { PATTERN_MAP } from "../../lib/glsl/patternMap";
import "../../lib/tsl/registerPatterns";
import "../../lib/tsl/registerOptionalTsl";
import { TSL_PATTERN_MAP } from "../../lib/tsl/tslBuilder";

const textureTypes = Object.values(TextureType);
const categorizedTextureTypes = Object.values(TEXTURE_CATEGORIES).flatMap(
  (category) => category.types,
);

describe("pattern registry integrity", () => {
  it("keeps every TextureType visible in exactly one UI category", () => {
    expect(categorizedTextureTypes).toHaveLength(textureTypes.length);
    expect(new Set(categorizedTextureTypes)).toEqual(new Set(textureTypes));
  });

  it("keeps every TextureType wired to metadata, GLSL, and TSL implementations", () => {
    const missingLabels = textureTypes.filter((type) => !SHADER_LABELS[type]);
    const missingGlsl = textureTypes.filter((type) => !PATTERN_MAP[type]);
    const missingTsl = textureTypes.filter((type) => !TSL_PATTERN_MAP[type]);

    expect(missingLabels).toEqual([]);
    expect(missingGlsl).toEqual([]);
    expect(missingTsl).toEqual([]);
  });
});
