import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { sanitizeValue, safeReplacer, useStorage } from "../../../core/state/useStorage";
import { mockAppState } from "../../helpers";

const idbMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

vi.mock("idb-keyval", () => ({
  get: idbMocks.get,
  set: idbMocks.set,
  del: idbMocks.del,
}));

const createMockStorage = (): Storage => {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },
    clear() {
      storage.clear();
    },
    getItem(key: string) {
      return storage.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(storage.keys())[index] ?? null;
    },
    removeItem(key: string) {
      storage.delete(key);
    },
    setItem(key: string, value: string) {
      storage.set(key, value);
    },
  } satisfies Storage;
};

describe("useStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    idbMocks.get.mockReset().mockResolvedValue(undefined);
    idbMocks.set.mockReset().mockResolvedValue(undefined);
    idbMocks.del.mockReset().mockResolvedValue(undefined);

    const mockStorage = createMockStorage();
    Object.defineProperty(window, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn(() => "blob:rehydrated-asset"),
      configurable: true,
      writable: true,
    });

    mockStorage.clear();
  });

  it("sanitizeValue filters unsafe objects and preserves valid values", () => {
    expect(sanitizeValue({ nodeType: 1 })).toBeUndefined();
    expect(sanitizeValue({ _reactInternals: {} })).toBeUndefined();
    expect(sanitizeValue("ok")).toBe("ok");
  });

  it("safeReplacer strips circular references and React internal props", () => {
    const replacer = safeReplacer();
    const circular: Record<string, unknown> = { ok: true };
    circular.self = circular;

    expect(replacer("_private", { hidden: true })).toBeUndefined();
    expect(replacer("ref", { current: null })).toBeUndefined();
    expect(replacer("self", circular)).toEqual(circular);
    expect(replacer("self", circular)).toBeUndefined();
  });

  it("loads lightweight state and rehydrates heavy assets from IndexedDB", async () => {
    const initialState = mockAppState();
    const onLoaded = vi.fn();

    localStorage.setItem(
      "effect_gen_v3_release",
      JSON.stringify({
        postProcess: { bloom: true },
        environment: { lightIntensity: 2.25 },
        settings: { antialias: false },
        colorBalance: {
          brightness: 0.5,
          shadows: { r: 0.1 },
        },
      }),
    );

    idbMocks.get.mockImplementation(async (key: string) => {
      if (key === "asset_base_texture") return "data:image/png;base64,base";
      if (key === "asset_custom_model") return "blob:custom-model";
      return undefined;
    });

    renderHook(() => useStorage(initialState, onLoaded));

    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1));

    const loadedState = onLoaded.mock.calls[0][0];
    expect(loadedState.postProcess.bloom).toBe(true);
    expect(loadedState.environment.lightIntensity).toBe(2.25);
    expect(loadedState.settings.antialias).toBe(false);
    expect(loadedState.baseTexture.texture).toBe("data:image/png;base64,base");
    expect(loadedState.customModel).toBe("blob:custom-model");
    expect(loadedState.colorBalance.brightness).toBe(0.5);
    expect(loadedState.colorBalance.shadows.g).toBe(initialState.colorBalance.shadows.g);
  });

  it("preserves valid lightweight state when one IndexedDB asset cannot be read", async () => {
    const onLoaded = vi.fn();
    localStorage.setItem("effect_gen_v3_release", JSON.stringify({ animate: false }));
    idbMocks.get.mockImplementation(async (key: string) => {
      if (key === "asset_custom_model") throw new Error("corrupt asset record");
      return undefined;
    });

    renderHook(() => useStorage(mockAppState(), onLoaded));
    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1));

    expect(onLoaded.mock.calls[0][0].animate).toBe(false);
    expect(localStorage.getItem("effect_gen_v3_release")).not.toBeNull();
  });

  it("stores heavy assets in IndexedDB and removes them from the lightweight payload", async () => {
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useStorage(mockAppState(), onLoaded));

    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    const nextState = mockAppState({
      baseTexture: {
        ...mockAppState().baseTexture,
        enabled: true,
        texture: "x".repeat(160),
      },
      sticker: {
        ...mockAppState().sticker,
        enabled: true,
        texture: "y".repeat(180),
      },
      customModel: "data:model/gltf-binary;base64," + "z".repeat(120),
    });

    await act(async () => {
      await result.current.saveState(nextState);
    });

    expect(idbMocks.set).toHaveBeenCalledTimes(1);
    const [bundleKey, bundle] = idbMocks.set.mock.calls[0];
    expect(bundleKey).toMatch(/^texture_genetics_v4_assets_/);
    expect(bundle).toMatchObject({
      version: 1,
      assets: {
        asset_base_texture: nextState.baseTexture.texture,
        asset_sticker_texture: nextState.sticker.texture,
        asset_custom_model: nextState.customModel,
      },
    });

    const persisted = JSON.parse(localStorage.getItem("texture_genetics_v4_release") ?? "{}");
    expect(persisted.baseTexture.texture).toBeNull();
    expect(persisted.sticker.texture).toBeNull();
    expect(persisted.customModel).toBeNull();
    expect(persisted.svg.url).toBeNull();
    expect(persisted["_version"]).toBe(4);
    expect(bundleKey).toBe(`texture_genetics_v4_assets_${persisted["_assetRevision"]}`);
    expect(persisted).not.toHaveProperty("isSettingsOpen");
    expect(persisted).not.toHaveProperty("isFullscreen");
  });

  it("skips IndexedDB asset rewrite on param-only saves", async () => {
    const { result } = renderHook(() => useStorage(mockAppState(), vi.fn()));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.saveState(
        mockAppState({
          baseTexture: { ...mockAppState().baseTexture, texture: "data:image/png;base64,keep" },
        }),
      );
    });
    expect(idbMocks.set).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.saveState(
        mockAppState({
          baseTexture: { ...mockAppState().baseTexture, texture: "data:image/png;base64,keep" },
          params: { ...mockAppState().params, scale: 4 },
        }),
      );
    });
    expect(idbMocks.set).toHaveBeenCalledTimes(1);
  });

  it("does not commit lightweight state when an asset transaction fails", async () => {
    idbMocks.set.mockRejectedValueOnce(new Error("quota exceeded"));
    const { result } = renderHook(() => useStorage(mockAppState(), vi.fn()));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    await act(async () => {
      await result.current.saveState(
        mockAppState({
          baseTexture: { ...mockAppState().baseTexture, texture: "data:image/png;base64,x" },
        }),
      );
    });

    expect(localStorage.getItem("texture_genetics_v4_release")).toBeNull();
  });

  it("persists blob URLs as durable Blob values and rehydrates them on load", async () => {
    const modelBlob = new Blob(["glTF"], { type: "model/gltf-binary" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, blob: vi.fn().mockResolvedValue(modelBlob) }),
    );
    const firstHook = renderHook(() => useStorage(mockAppState(), vi.fn()));
    await waitFor(() => expect(firstHook.result.current.isInitialized).toBe(true));

    await act(async () => {
      await firstHook.result.current.saveState(
        mockAppState({ customModel: "blob:temporary-model" }),
      );
    });

    const [bundleKey, savedBundle] = idbMocks.set.mock.calls[0];
    expect(savedBundle.assets.asset_custom_model).toBe(modelBlob);

    firstHook.unmount();
    const persisted = JSON.parse(localStorage.getItem("texture_genetics_v4_release") ?? "{}");
    idbMocks.get
      .mockReset()
      .mockImplementation(async (key: string) => (key === bundleKey ? savedBundle : undefined));
    const onLoaded = vi.fn();
    renderHook(() => useStorage(mockAppState(), onLoaded));
    await waitFor(() => expect(onLoaded).toHaveBeenCalledTimes(1));

    expect(persisted._assetRevision).toBe(bundleKey.replace("texture_genetics_v4_assets_", ""));
    expect(onLoaded.mock.calls[0][0].customModel).toBe("blob:rehydrated-asset");
    expect(URL.createObjectURL).toHaveBeenCalledWith(modelBlob);
  });

  it("migrates a v3 state and asset revision only after a successful v4 save", async () => {
    const legacyRevision = "legacy-revision";
    localStorage.setItem(
      "effect_gen_v3_release",
      JSON.stringify({ animate: false, _version: 3, _assetRevision: legacyRevision }),
    );
    idbMocks.get.mockImplementation(async (key: string) =>
      key === `effect_gen_v3_assets_${legacyRevision}` ? { version: 1, assets: {} } : undefined,
    );
    const onLoaded = vi.fn();
    const { result } = renderHook(() => useStorage(mockAppState(), onLoaded));
    await waitFor(() => expect(result.current.isInitialized).toBe(true));

    expect(onLoaded.mock.calls[0][0].animate).toBe(false);
    expect(localStorage.getItem("texture_genetics_v4_release")).toBeNull();

    await act(async () => {
      expect(await result.current.saveState(onLoaded.mock.calls[0][0])).toBe(true);
    });

    expect(localStorage.getItem("texture_genetics_v4_release")).not.toBeNull();
    expect(localStorage.getItem("effect_gen_v3_release")).toBeNull();
    expect(idbMocks.del).toHaveBeenCalledWith(`effect_gen_v3_assets_${legacyRevision}`);
  });
});
