import { describe, expect, it } from "vitest";
import { generateLegacyStandaloneHtml } from "@/features/export/legacy/standaloneHtml";
import { mockAppState } from "@/__tests__/helpers";

describe("generateLegacyStandaloneHtml", () => {
  it("serializes hostile state strings as data instead of executable markup", () => {
    const hostileColor = "</script><script>globalThis.__presetCodeExecuted = true</script><script>";
    const state = mockAppState({
      params: {
        ...mockAppState().params,
        color1: hostileColor,
        palette: [{ color: hostileColor, enabled: true }],
      },
    });

    const html = generateLegacyStandaloneHtml(state);

    expect(html).not.toContain(hostileColor);
    expect(html).toContain("\\u003c/script\\u003e");
    expect(html.match(/<script/g)).toHaveLength(2);
  });

  it("does not turn runtime-invalid numeric state into JavaScript source", () => {
    const hostileNumber =
      "</script><script>globalThis.__numericCodeExecuted = true</script><script>";
    const state = mockAppState();
    state.params.intensity = hostileNumber as unknown as number;

    const html = generateLegacyStandaloneHtml(state);

    expect(html).not.toContain(hostileNumber);
    expect(html).toContain("\\u003c/script\\u003e");
    expect(html.match(/<script/g)).toHaveLength(2);
  });
});
