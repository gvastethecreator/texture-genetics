import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GeometryType, type GeometryConfig } from "../../../core/types/types";
import {
  MAX_GEOMETRY_CACHE_SIZE,
  clearGeometryCache,
  getGeometryCacheStats,
  getGeometryForType,
  normalizeGeometryConfig,
} from "../../../lib/three/geometryFactory";

const config = (rounding: number): GeometryConfig => ({
  bevelEnabled: false,
  bevelThickness: 0.02,
  bevelSize: 0.02,
  bevelSegments: 4,
  rounding,
  smoothness: 8,
});

describe("geometryFactory cache budget", () => {
  beforeEach(clearGeometryCache);
  afterEach(clearGeometryCache);

  it("quantizes continuous geometry controls deterministically", () => {
    expect(normalizeGeometryConfig(config(0.101)).rounding).toBe(0.1);
    expect(normalizeGeometryConfig({ ...config(0), smoothness: 63 }).smoothness).toBe(64);
  });

  it("stays under its GPU allocation limit and disposes LRU entries over 500 changes", () => {
    const first = getGeometryForType(GeometryType.PLANE, config(0));
    const firstDispose = vi.spyOn(first, "dispose");

    for (let index = 1; index <= 500; index += 1) {
      getGeometryForType(GeometryType.PLANE, config(index / 500));
    }

    expect(getGeometryCacheStats()).toEqual({
      size: MAX_GEOMETRY_CACHE_SIZE,
      limit: MAX_GEOMETRY_CACHE_SIZE,
    });
    expect(firstDispose).toHaveBeenCalledOnce();
  });
});
