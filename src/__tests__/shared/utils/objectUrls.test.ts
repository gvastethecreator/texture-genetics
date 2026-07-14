import { describe, expect, it, vi } from "vitest";
import { revokeReplacedObjectUrls } from "@/shared/utils/objectUrls";

describe("revokeReplacedObjectUrls", () => {
  it("does not revoke an asset when the canvas remounts with unchanged state", () => {
    const revoke = vi.fn();
    const urls = new Set(["blob:active-model"]);

    revokeReplacedObjectUrls(urls, new Set(urls), revoke);

    expect(revoke).not.toHaveBeenCalled();
  });

  it("revokes only URLs that the application state replaced", () => {
    const revoke = vi.fn();

    revokeReplacedObjectUrls(
      new Set(["blob:old-model", "blob:shared-texture"]),
      new Set(["blob:new-model", "blob:shared-texture"]),
      revoke,
    );

    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:old-model");
  });
});
