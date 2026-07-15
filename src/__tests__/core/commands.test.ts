import { describe, expect, it, vi } from "vitest";
import { APP_SHORTCUTS, createShortcutKeyMap } from "../../core/commands";

describe("command registry", () => {
  it("keeps every keyboard combination unique", () => {
    const keys = APP_SHORTCUTS.flatMap((shortcut) => shortcut.keys);
    expect(new Set(keys)).toHaveLength(keys.length);
  });

  it("routes every alias to the same command handler", () => {
    const redo = vi.fn();
    const map = createShortcutKeyMap({ redo });
    const event = new KeyboardEvent("keydown");

    map["mod+y"]?.(event);
    map["mod+shift+z"]?.(event);

    expect(redo).toHaveBeenCalledTimes(2);
  });
});
