import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "@/features/export/core/browserFiles";

describe("downloadBlob", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:download"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
  });

  it("removes the temporary anchor and revokes its URL even when click throws", () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("download blocked");
    });

    expect(() => downloadBlob(new Blob(["data"]), "texture.png")).toThrow("download blocked");

    expect(document.querySelector('a[download="texture.png"]')).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:download");
    click.mockRestore();
  });
});
