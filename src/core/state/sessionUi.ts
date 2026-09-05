import type { AppState } from "../types/types";

export const SESSION_UI_KEYS = [
  "isSettingsOpen",
  "isCodeOpen",
  "isShortcutsOpen",
  "isFullscreen",
] as const;

export type SessionUiKey = (typeof SESSION_UI_KEYS)[number];

export type SessionUiState = Pick<AppState, SessionUiKey>;

const SESSION_UI_KEY_SET = new Set<string>(SESSION_UI_KEYS);

export const isSessionUiKey = (key: string): key is SessionUiKey => SESSION_UI_KEY_SET.has(key);

export const sessionUiFrom = (state: Pick<AppState, SessionUiKey>): SessionUiState => ({
  isSettingsOpen: state.isSettingsOpen,
  isCodeOpen: state.isCodeOpen,
  isShortcutsOpen: state.isShortcutsOpen,
  isFullscreen: state.isFullscreen,
});

export const stripSessionUi = <T extends Partial<AppState>>(state: T): Omit<T, SessionUiKey> => {
  const next = { ...state };
  for (const key of SESSION_UI_KEYS) delete next[key];
  return next;
};

export const isSessionOnlyPatch = (partial: Partial<AppState>): boolean => {
  const keys = Object.keys(partial);
  return keys.length > 0 && keys.every(isSessionUiKey);
};
