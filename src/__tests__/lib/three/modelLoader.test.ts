import { describe, expect, it } from "vitest";
import { detectModelFormat, parseModelGeometryData } from "@/lib/three/modelLoader";

const encode = (value: string): ArrayBuffer => new TextEncoder().encode(value).buffer;

describe("modelLoader", () => {
  it("detects glTF JSON by content when the source URL is an opaque blob", () => {
    const data = encode(
      JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [] }], scene: 0 }),
    );

    expect(detectModelFormat(data, "blob:https://example.test/opaque-id")).toBe("gltf");
  });

  it("rejects a syntactically valid glTF that contains no renderable geometry", async () => {
    const data = encode(
      JSON.stringify({ asset: { version: "2.0" }, scenes: [{ nodes: [] }], scene: 0 }),
    );

    await expect(parseModelGeometryData(data, "gltf")).rejects.toThrow(
      "Model does not contain renderable mesh geometry",
    );
  });

  it("parses valid OBJ geometry without relying on a loader fallback", async () => {
    const data = encode("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n");

    const geometry = await parseModelGeometryData(data, "obj");

    expect(geometry.getAttribute("position").count).toBe(3);
    expect(geometry.boundingSphere).not.toBeNull();
    geometry.dispose();
  });
});
