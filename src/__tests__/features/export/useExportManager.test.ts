import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useExportManager } from "@/features/export/useExportManager";
import { mockAppState } from "@/__tests__/helpers";

const mocks = vi.hoisted(() => ({
  generateGif: vi.fn(),
  downloadBlob: vi.fn(),
}));

vi.mock("@/features/export/strategies/gifStrategy", () => ({ generateGif: mocks.generateGif }));
vi.mock("@/features/export/core/browserFiles", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/export/core/browserFiles")>();
  return { ...actual, downloadBlob: mocks.downloadBlob };
});

describe("useExportManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(mocks.downloadBlob).toHaveBeenCalledOnce();
  });

  it("does not report success or download an empty export", async () => {
    mocks.generateGif.mockResolvedValueOnce(new Blob([], { type: "image/gif" }));
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useExportManager(mockAppState(), { onSuccess, onError }));

    await act(async () => result.current.generateGif());

    expect(mocks.downloadBlob).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("GIF Failed: GIF generated an empty file");
  });
});
