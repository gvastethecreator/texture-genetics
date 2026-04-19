import { describe, it, expect } from "vitest";
import { DEFAULTS } from "../../core/constants";
import { TextureType, ViewMode, GeometryType } from "../../core/types/types";

describe("DEFAULTS", () => {
  it("has a valid resolution", () => {
    expect(DEFAULTS.RESOLUTION).toBe(512);
    expect(typeof DEFAULTS.RESOLUTION).toBe("number");
  });

  it("has a valid texture type", () => {
    expect(Object.values(TextureType)).toContain(DEFAULTS.TEXTURE_TYPE);
  });

  it("has a valid geometry type", () => {
    expect(Object.values(GeometryType)).toContain(DEFAULTS.GEOMETRY);
  });

  it("has a valid view mode", () => {
    expect(Object.values(ViewMode)).toContain(DEFAULTS.VIEW_MODE);
  });

  it("has default animation enabled", () => {
    expect(DEFAULTS.ANIMATE).toBe(true);
  });

  it("has params with scale, intensity, speed defaults", () => {
    expect(DEFAULTS.PARAMS.scale).toBe(1.0);
    expect(DEFAULTS.PARAMS.intensity).toBe(1.0);
    expect(DEFAULTS.PARAMS.speed).toBe(0.5);
  });

  it("has a palette with at least 2 entries", () => {
    expect(DEFAULTS.PARAMS.palette.length).toBeGreaterThanOrEqual(2);
  });

  it("has blending config", () => {
    expect(DEFAULTS.BLENDING).toBeDefined();
    expect(typeof DEFAULTS.BLENDING.enabled).toBe("boolean");
    expect(typeof DEFAULTS.BLENDING.opacity).toBe("number");
  });

  it("has post processing config", () => {
    expect(DEFAULTS.POST_PROCESS).toBeDefined();
    expect(typeof DEFAULTS.POST_PROCESS.applyToMap).toBe("boolean");
  });

  it("has transform defaults at zero", () => {
    expect(DEFAULTS.TRANSFORM.angle).toBe(0);
    expect(DEFAULTS.TRANSFORM.offsetX).toBe(0);
    expect(DEFAULTS.TRANSFORM.offsetY).toBe(0);
  });
});
