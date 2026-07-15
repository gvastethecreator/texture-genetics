export type ShortcutCommandId =
  | "toggle-animation"
  | "randomize"
  | "undo"
  | "redo"
  | "toggle-panels"
  | "show-shortcuts"
  | "exit-fullscreen";

export interface ShortcutDefinition {
  readonly id: ShortcutCommandId;
  readonly keys: readonly string[];
  readonly displayKey: string;
  readonly description: string;
}

export const APP_SHORTCUTS: readonly ShortcutDefinition[] = Object.freeze([
  {
    id: "toggle-animation",
    keys: ["space"],
    displayKey: "Space",
    description: "Pause / play animation",
  },
  {
    id: "randomize",
    keys: ["r"],
    displayKey: "R",
    description: "Smart randomize texture",
  },
  { id: "undo", keys: ["mod+z"], displayKey: "Ctrl/⌘ + Z", description: "Undo" },
  {
    id: "redo",
    keys: ["mod+y", "mod+shift+z"],
    displayKey: "Ctrl/⌘ + Y / ⇧⌘Z",
    description: "Redo",
  },
  {
    id: "toggle-panels",
    keys: ["h"],
    displayKey: "H",
    description: "Hide / restore workbench panels",
  },
  {
    id: "show-shortcuts",
    keys: ["?"],
    displayKey: "?",
    description: "Show keyboard shortcuts",
  },
  {
    id: "exit-fullscreen",
    keys: ["escape"],
    displayKey: "Esc",
    description: "Exit fullscreen",
  },
]);

type ShortcutHandler = (event: KeyboardEvent) => void;

export const createShortcutKeyMap = (
  handlers: Partial<Record<ShortcutCommandId, ShortcutHandler | undefined>>,
): Record<string, ShortcutHandler> => {
  const keyMap: Record<string, ShortcutHandler> = {};
  for (const shortcut of APP_SHORTCUTS) {
    const handler = handlers[shortcut.id];
    if (!handler) continue;
    for (const key of shortcut.keys) keyMap[key] = handler;
  }
  return keyMap;
};
