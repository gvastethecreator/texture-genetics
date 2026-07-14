import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePresetManager } from "@/core/state/usePresetManager";
import { mockAppState } from "@/__tests__/helpers";

const idbMocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
}));

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
};

vi.mock("idb-keyval", () => ({
  get: idbMocks.get,
  set: idbMocks.set,
}));

describe("usePresetManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    idbMocks.get.mockResolvedValue([]);
    idbMocks.set.mockResolvedValue(undefined);
  });

  it("does not mutate memory or IndexedDB when an imported preset fails schema validation", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    const file = new File(
      [
        JSON.stringify([
          {
            id: "invalid",
            name: "Invalid",
            date: 1,
            state: { params: { intensity: "not-a-number" } },
          },
        ]),
      ],
      "invalid-presets.json",
      { type: "application/json" },
    );

    await act(async () => {
      await result.current.actions.importPresets(file);
    });

    expect(result.current.userPresets).toEqual([]);
    expect(idbMocks.set).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith("error", expect.stringContaining("Invalid preset"));
  });

  it("reports malformed JSON as an invalid file instead of a storage failure", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.actions.importPresets(
        new File(["{ definitely not json"], "broken.json", { type: "application/json" }),
      );
    });

    expect(idbMocks.set).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith("error", "Invalid preset file: invalid JSON");
  });

  it("keeps memory unchanged when persistence rejects a valid import", async () => {
    idbMocks.set.mockRejectedValueOnce(new Error("quota exceeded"));
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    const file = new File(
      [JSON.stringify([{ id: "valid", name: "Valid", date: 1, state: { animate: false } }])],
      "valid-presets.json",
      { type: "application/json" },
    );

    await act(async () => {
      await result.current.actions.importPresets(file);
    });

    expect(result.current.userPresets).toEqual([]);
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Preset import could not be saved; no changes were applied",
    );
  });

  it("does not create a memory-only preset when saving to IndexedDB fails", async () => {
    idbMocks.set.mockRejectedValueOnce(new Error("quota exceeded"));
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.actions.saveUserPreset("Cannot persist");
    });

    expect(result.current.userPresets).toEqual([]);
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Preset could not be saved; no changes were applied",
    );
  });

  it("does not delete a preset from memory when IndexedDB deletion persistence fails", async () => {
    idbMocks.get.mockResolvedValueOnce([
      { id: "keep-me", name: "Keep me", date: 1, state: { animate: true } },
    ]);
    idbMocks.set.mockRejectedValueOnce(new Error("transaction aborted"));
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(result.current.userPresets).toHaveLength(1));

    await act(async () => {
      await result.current.actions.deleteUserPreset("keep-me");
    });

    expect(result.current.userPresets.map((preset) => preset.id)).toEqual(["keep-me"]);
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Preset could not be deleted; no changes were applied",
    );
  });

  it("rejects blank preset names before creating an unreimportable document", async () => {
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.actions.saveUserPreset("   ");
    });

    expect(idbMocks.set).not.toHaveBeenCalled();
    expect(result.current.userPresets).toEqual([]);
    expect(addToast).toHaveBeenCalledWith("error", "Preset name must contain 1 to 120 characters");
  });

  it("persists complete independent state for consecutive presets", async () => {
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast: vi.fn(),
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.actions.saveUserPreset("First");
    });
    await act(async () => {
      await result.current.actions.saveUserPreset("Second");
    });

    const persisted = idbMocks.set.mock.calls.at(-1)?.[1];
    expect(persisted).toHaveLength(2);
    expect(persisted[0].state.params).toEqual(persisted[1].state.params);
    expect(persisted[0].state.environment).toEqual(persisted[1].state.environment);
    expect(persisted[0].state.postProcess).toEqual(persisted[1].state.postProcess);
  });

  it("serializes concurrent saves against the latest committed preset collection", async () => {
    const firstWrite = deferred();
    idbMocks.set.mockImplementationOnce(() => firstWrite.promise).mockResolvedValueOnce(undefined);
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast: vi.fn(),
      }),
    );
    await waitFor(() => expect(idbMocks.get).toHaveBeenCalledTimes(1));

    let firstSave!: Promise<void>;
    let secondSave!: Promise<void>;
    act(() => {
      firstSave = result.current.actions.saveUserPreset("First concurrent");
      secondSave = result.current.actions.saveUserPreset("Second concurrent");
    });

    await waitFor(() => expect(idbMocks.set).toHaveBeenCalledTimes(1));
    firstWrite.resolve();
    await act(async () => {
      await Promise.all([firstSave, secondSave]);
    });

    expect(idbMocks.set).toHaveBeenCalledTimes(2);
    expect(idbMocks.set.mock.calls[0][1]).toHaveLength(1);
    expect(idbMocks.set.mock.calls[1][1]).toHaveLength(2);
    expect(result.current.userPresets.map((preset) => preset.name)).toEqual([
      "First concurrent",
      "Second concurrent",
    ]);
  });

  it("recovers valid stored presets without overwriting invalid source data", async () => {
    idbMocks.get.mockResolvedValueOnce([
      { id: "valid", name: "Valid", date: 1, state: { animate: true } },
      {
        id: "invalid",
        name: "Invalid",
        date: 2,
        state: { spriteSheet: { columns: 0 } },
      },
    ]);
    const addToast = vi.fn();
    const { result } = renderHook(() =>
      usePresetManager({
        initialState: mockAppState(),
        onLoadPreset: vi.fn(),
        addToast,
      }),
    );

    await waitFor(() => expect(result.current.userPresets).toHaveLength(1));

    expect(result.current.userPresets[0].id).toBe("valid");
    expect(idbMocks.set).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith(
      "error",
      "Loaded 1 saved preset; skipped 1 invalid preset. Original storage was left unchanged.",
    );
  });
});
