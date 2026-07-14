import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTextureResource } from "@/shared/hooks/useTextureResource";

const loaderCallbacks = vi.hoisted(
  () =>
    [] as Array<{
      success: (texture: MockTexture) => void;
      failure: (error: unknown) => void;
    }>,
);

interface MockTexture {
  id: string;
  colorSpace: string;
  dispose: ReturnType<typeof vi.fn>;
}

vi.mock("three", async (importOriginal) => {
  const actual = await importOriginal<typeof import("three")>();
  return {
    ...actual,
    TextureLoader: class {
      load(
        _url: string,
        success: (texture: MockTexture) => void,
        _progress: unknown,
        failure: (error: unknown) => void,
      ) {
        loaderCallbacks.push({ success, failure });
      }
    },
  };
});

const mockTexture = (id: string): MockTexture => ({
  id,
  colorSpace: "",
  dispose: vi.fn(),
});

describe("useTextureResource", () => {
  it("ignores and disposes a stale load that resolves after the current URL", () => {
    loaderCallbacks.length = 0;
    const { result, rerender, unmount } = renderHook(
      ({ url }: { url: string | null }) => useTextureResource(url),
      { initialProps: { url: "blob:first" } },
    );
    rerender({ url: "blob:second" });
    const first = mockTexture("first");
    const second = mockTexture("second");

    act(() => loaderCallbacks[1].success(second));
    act(() => loaderCallbacks[0].success(first));

    expect(result.current).toBe(second);
    expect(first.dispose).toHaveBeenCalledOnce();
    expect(second.dispose).not.toHaveBeenCalled();

    unmount();
    expect(second.dispose).toHaveBeenCalledOnce();
  });
});
