import { describe, expect, it } from "vitest";
import { TextureType } from "../../core/types/types";
import {
  PATTERN_CATEGORIES,
  PATTERN_MANIFEST,
  PATTERN_MANIFEST_BY_TYPE,
  buildPatternManifest,
} from "../../data/patternManifest";
import { SHADER_LABELS, TEXTURE_CATEGORIES } from "../../data/textureData";
import { PATTERN_MAP } from "../../lib/glsl/patternMap";
import { TSL_PATTERN_MAP } from "../../lib/tsl/tslBuilder";

const validSources = {
  types: Object.values(TextureType),
  categories: TEXTURE_CATEGORIES,
  labels: SHADER_LABELS,
  glsl: PATTERN_MAP,
  tsl: TSL_PATTERN_MAP,
};

describe("pattern manifest", () => {
  it("covers every enum value exactly once in stable declaration order", () => {
    const types = Object.values(TextureType);

    expect(PATTERN_MANIFEST.map((entry) => entry.type)).toEqual(types);
    expect(new Set(PATTERN_MANIFEST.map((entry) => entry.type))).toHaveLength(types.length);
    expect(PATTERN_CATEGORIES.flatMap((category) => category.types)).toHaveLength(types.length);
    expect(PATTERN_MANIFEST_BY_TYPE[TextureType.CHECKER].definition.name).toBe("Checkerboard");
  });

  it("reports renderer gaps instead of exposing a broken selectable pattern", () => {
    expect(() =>
      buildPatternManifest({
        ...validSources,
        glsl: { ...PATTERN_MAP, [TextureType.CHECKER]: undefined },
        tsl: { ...TSL_PATTERN_MAP, [TextureType.CIRCLE]: undefined },
      }),
    ).toThrowError(
      /Missing GLSL implementation for pattern: Checker[\s\S]*Missing TSL implementation/,
    );
  });

  it("reports duplicate category ownership with the conflicting names", () => {
    expect(() =>
      buildPatternManifest({
        ...validSources,
        categories: {
          ...TEXTURE_CATEGORIES,
          Duplicate: {
            ...TEXTURE_CATEGORIES["Shapes & Basics"],
            types: [TextureType.CHECKER],
          },
        },
      }),
    ).toThrowError(/Checker.*Shapes & Basics, Duplicate/);
  });
});
