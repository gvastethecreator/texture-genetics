import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as browserFiles from "@/features/export/core/browserFiles";
import { useExportManager } from "@/features/export/useExportManager";
import { mockAppState } from "@/__tests__/helpers";

const mocks = vi.hoisted(() => ({
  generateGif: vi.fn(),
}));

vi.mock("@/features/export/strategies/gifStrategy", () => ({ generateGif: mocks.generateGif }));

describe("useExportManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(browserFiles, "downloadBlob").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.mocked(browserFiles.downloadBlob).mockRestore();
  });

  it("serializes immediate repeated export requests before React state updates", async () => {
    let finish!: (blob: Blob) => void;
    mocks.generateGif.mockReturnValueOnce(
      new Promise<Blob>((resolve) => {
        finish = resolve;
      }),
    );
    const onError = vi.fn();
    const { result } = renderHook(() => useExportManager(mockAppState(), { onError }));

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = result.current.generateGif();
      second = result.current.generateGif();
    });
    await second;

    await vi.waitFor(() => expect(mocks.generateGif).toHaveBeenCalledOnce());
    expect(onError).toHaveBeenCalledWith("An export is already in progress");

    finish(new Blob(["gif"], { type: "image/gif" }));
    await act(async () => first);
    expect(browserFiles.downloadBlob).toHaveBeenCalledOnce();
  });

  it("does not report success or download an empty export", async () => {
    mocks.generateGif.mockResolvedValueOnce(new Blob([], { type: "image/gif" }));
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useExportManager(mockAppState(), { onSuccess, onError }));

    await act(async () => result.current.generateGif());

    expect(browserFiles.downloadBlob).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("GIF Failed: GIF generated an empty file");
  });

  it("exports the document from the click, not a later rerender", async () => {
    let seenState: { animate?: boolean } | undefined;
    mocks.generateGif.mockImplementation(async (exportState: { animate: boolean }) => {
      seenState = exportState;
      return new Blob(["gif"], { type: "image/gif" });
    });
    const first = mockAppState({ animate: false });
    const { result, rerender } = renderHook(({ state }) => useExportManager(state, {}), {
      initialProps: { state: first },
    });

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.generateGif();
    });
    rerender({ state: mockAppState({ animate: true }) });
    await act(async () => pending);

    expect(seenState?.animate).toBe(false);
  });
});
