import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useHistoryStack } from "@/core/state/useHistoryStack";
import { ingestUserFile } from "@/shared/utils/ingest";
import { collectStateObjectUrls, syncLiveObjectUrls } from "@/shared/utils/objectUrls";
import { mockAppState } from "@/__tests__/helpers";

const blobUrlIsLive = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

describe("history-referenced object URLs", () => {
  it("keeps a committed ingest blob live across replace, live revoke, and undo", async () => {
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL");
    const { result } = renderHook(() => useHistoryStack());

    let live = mockAppState();
    let liveUrls = collectStateObjectUrls(live);

    const first = ingestUserFile(new File(["one"], "a.png", { type: "image/png" }), live);
    expect(first.ok).toBe(true);
    expect(first.objectUrl).toBeTruthy();
    live = { ...live, ...first.patch };
    const url1 = first.objectUrl!;
    const afterFirst = collectStateObjectUrls(live);
    syncLiveObjectUrls(liveUrls, afterFirst);
    liveUrls = afterFirst;

    act(() => {
      result.current.pushToHistory(live);
    });

    const second = ingestUserFile(new File(["two"], "b.png", { type: "image/png" }), live);
    expect(second.ok).toBe(true);
    live = { ...live, ...second.patch };
    const afterReplace = collectStateObjectUrls(live);
    syncLiveObjectUrls(liveUrls, afterReplace);
    liveUrls = afterReplace;

    expect(revokeSpy).not.toHaveBeenCalledWith(url1);
    expect(await blobUrlIsLive(url1)).toBe(true);

    act(() => {
      result.current.pushToHistory(live);
    });

    const previous = result.current.historyControl.getPrevious();
    expect(previous?.baseTexture.texture).toBe(url1);
    expect(await blobUrlIsLive(url1)).toBe(true);

    act(() => {
      result.current.historyControl.undo();
    });
    const restored = collectStateObjectUrls(previous!);
    syncLiveObjectUrls(liveUrls, restored);
    expect(previous?.baseTexture.texture).toBe(url1);
    expect(await blobUrlIsLive(url1)).toBe(true);
  });
});
