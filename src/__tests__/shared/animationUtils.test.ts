import { describe, it, expect } from "vitest";
import { calculateAnimatedValue } from "../../shared/utils/animationUtils";
import { WaveType } from "../../core/types/types";

describe("calculateAnimatedValue", () => {
  const baseConfig = {
    enabled: true,
    speed: 1,
    min: 0,
    max: 1,
    type: WaveType.SINE,
  };

  it("returns value within min-max range for SINE wave", () => {
    for (let t = 0; t < 10; t += 0.1) {
      const val = calculateAnimatedValue(t, baseConfig);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it("returns value within custom range", () => {
    const config = { ...baseConfig, min: 5, max: 10 };
    for (let t = 0; t < 10; t += 0.5) {
      const val = calculateAnimatedValue(t, config);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it("handles COSINE wave type", () => {
    const config = { ...baseConfig, type: WaveType.COSINE };
    const val = calculateAnimatedValue(0, config);
    expect(val).toBeCloseTo(1, 1);
  });

  it("handles TRIANGLE wave type", () => {
    const config = { ...baseConfig, type: WaveType.TRIANGLE };
    const val = calculateAnimatedValue(0, config);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  });

  it("handles SAWTOOTH wave type", () => {
    const config = { ...baseConfig, type: WaveType.SAWTOOTH };
    const val = calculateAnimatedValue(0, config);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  });

  it("handles NOISE wave type", () => {
    const config = { ...baseConfig, type: WaveType.NOISE };
    const val = calculateAnimatedValue(1, config);
    expect(val).toBeGreaterThanOrEqual(0);
    expect(val).toBeLessThanOrEqual(1);
  });

  it("speed affects frequency", () => {
    const slow = { ...baseConfig, speed: 0.1 };
    const fast = { ...baseConfig, speed: 10 };
    const valSlow = calculateAnimatedValue(1, slow);
    const valFast = calculateAnimatedValue(1, fast);
    expect(valSlow).not.toEqual(valFast);
  });
});
