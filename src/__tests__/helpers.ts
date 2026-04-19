import { vi } from "vitest";
import { AppState } from "../core/types/types";
import { DEFAULTS } from "../core/constants";

/**
 * Creates a full mock AppState based on DEFAULTS for testing.
 */
export const mockAppState = (overrides?: Partial<AppState>): AppState => ({
  resolution: DEFAULTS.RESOLUTION,
  textureType: DEFAULTS.TEXTURE_TYPE,
  geometry: DEFAULTS.GEOMETRY,
  geometryConfig: { ...DEFAULTS.GEOMETRY_CONFIG },
  viewMode: DEFAULTS.VIEW_MODE,
  animate: DEFAULTS.ANIMATE,
  time: DEFAULTS.TIME,
  isFullscreen: false,
  tilingPreview: false,
  tileMode: DEFAULTS.TILE_MODE,
  gridOverlay: false,
  isSidebarOpen: true,
  isSettingsOpen: false,
  isCodeOpen: false,
  isShortcutsOpen: false,
  params: { ...DEFAULTS.PARAMS },
  paramAnimations: { ...DEFAULTS.PARAM_ANIMATIONS },
  blending: { ...DEFAULTS.BLENDING },
  baseTexture: { ...DEFAULTS.BASE_TEXTURE },
  sticker: { ...DEFAULTS.STICKER },
  transform: { ...DEFAULTS.TRANSFORM },
  symmetry: { ...DEFAULTS.SYMMETRY },
  tiling: { ...DEFAULTS.TILING },
  postProcess: { ...DEFAULTS.POST_PROCESS },
  normalMap: { ...DEFAULTS.NORMAL_MAP },
  displacement: { ...DEFAULTS.DISPLACEMENT },
  ao: { ...DEFAULTS.AO },
  colorBalance: { ...DEFAULTS.COLOR_BALANCE },
  imageAlpha: { ...DEFAULTS.IMAGE_ALPHA },
  spriteSheet: { ...DEFAULTS.SPRITE_SHEET },
  mouse: { ...DEFAULTS.MOUSE },
  environment: { ...DEFAULTS.ENVIRONMENT },
  settings: { ...DEFAULTS.SETTINGS },
  camera: { ...DEFAULTS.CAMERA },
  customModel: DEFAULTS.CUSTOM_MODEL,
  svg: { ...DEFAULTS.SVG },
  text: { ...DEFAULTS.TEXT },
  ...overrides,
});

export const mockHistory = () => ({
  canUndo: false,
  canRedo: false,
  undo: vi.fn(),
  redo: vi.fn(),
  commit: vi.fn(),
});

export const mockHeaderActions = () => ({
  updateState: vi.fn(),
  randomize: vi.fn(),
  loadPreset: vi.fn(),
  selectTexture: vi.fn(),
  saveUserPreset: vi.fn(),
  deleteUserPreset: vi.fn(),
  resetState: vi.fn(),
});

export const mockFullActions = () => ({
  ...mockHeaderActions(),
  replaceState: vi.fn(),
  updateParams: vi.fn(),
  updateParamAnimation: vi.fn(),
  randomizeParams: vi.fn(),
  randomizePalette: vi.fn(),
  randomizePatternSelection: vi.fn(),
  importPresets: vi.fn(),
  exportPresets: vi.fn(),
  addToast: vi.fn(),
  removeToast: vi.fn(),
});
