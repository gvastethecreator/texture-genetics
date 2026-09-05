import type { AppState } from "../types/types";
import { stripSessionUi } from "./sessionUi";

const HEAVY_STRING_PREFIXES = ["data:", "blob:"];

const isHeavyAssetString = (value: unknown): value is string =>
  typeof value === "string" && HEAVY_STRING_PREFIXES.some((prefix) => value.startsWith(prefix));

const cloneValue = (value: unknown): unknown => {
  if (isHeavyAssetString(value)) return value;
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      next[key] = cloneValue(entry);
    }
    return next;
  }
  return value;
};

export const cloneHistorySnapshot = (state: AppState): AppState =>
  cloneValue(stripSessionUi(state)) as AppState;
