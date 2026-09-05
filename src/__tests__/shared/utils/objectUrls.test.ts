import { describe, expect, it, vi } from "vitest";
import { releaseObjectUrls, retainObjectUrls, syncLiveObjectUrls } from "@/shared/utils/objectUrls";

describe("object URL registry", () => {
  it("does not revoke an asset when the canvas remounts with unchanged state", () => {
    const revoke = vi.fn();
    const urls = new Set(["blob:active-model"]);

    syncLiveObjectUrls(urls, new Set(urls), revoke);

    expect(revoke).not.toHaveBeenCalled();
  });

  it("revokes only URLs that the live document replaced", () => {
    const revoke = vi.fn();

    syncLiveObjectUrls(
      new Set(["blob:old-model", "blob:shared-texture"]),
      new Set(["blob:new-model", "blob:shared-texture"]),
      revoke,
    );

    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:old-model");
  });

  it("keeps a live-replaced URL until history also releases it", () => {
    const revoke = vi.fn();
    syncLiveObjectUrls(new Set(), new Set(["blob:committed"]), revoke);
    retainObjectUrls(["blob:committed"]);
    syncLiveObjectUrls(new Set(["blob:committed"]), new Set(["blob:next"]), revoke);
    expect(revoke).not.toHaveBeenCalled();
    releaseObjectUrls(["blob:committed"], revoke);
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:committed");
  });
});
