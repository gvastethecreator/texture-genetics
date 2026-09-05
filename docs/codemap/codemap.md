# Code map · texture-genetics

generated: 2026-09-05T06:00:00Z
commit: f309ccc4cde8
scope: .

counts: 13 nodes · 27 edges · 0 flows · 0 unknown

## Modules

- `external-dependencies` · `index.tsx` · external · External
  callers: index (imports), src (imports), src-core (imports), src-data (imports), src-features (imports), src-lib (imports), src-shared (imports), vite-config (imports), vitest-config (imports)
  callees: (none)
  tests: (none)
  entry: index.tsx:react

- `index` · `index.tsx` · module · Index
  callers: (none)
  callees: external-dependencies (imports), src (imports)
  tests: (none)
  entry: index.tsx:rootElement

- `repository` · `package.json` · module · Repository
  callers: (none)
  callees: scripts (calls)
  tests: (none)
  entry: package.json:{

- `scripts` · `scripts` · service · Scripts
  callers: repository (calls)
  callees: (none)
  tests: (none)
  entry: scripts/check-build-budget.mjs:distDir

- `src` · `src` · module · Src
  callers: index (imports), src-features (imports)
  callees: external-dependencies (imports), src-core (imports), src-features (imports), src-lib (imports), src-shared (imports)
  tests: (none)
  entry: src/App.tsx:SettingsModal

- `src-core` · `src/core` · service · Src
  callers: src (imports), src-data (imports), src-features (imports), src-lib (imports), src-shared (imports)
  callees: external-dependencies (imports), src-data (imports), src-shared (imports)
  tests: src/__tests__/core/commands.test.ts, src/__tests__/core/state/presetFile.test.ts, src/__tests__/core/state/useHistoryStack.test.ts, src/__tests__/core/state/usePresetManager.test.ts, src/__tests__/core/state/useStorage.test.ts
  entry: src/core/commands.ts:ShortcutCommandId

- `src-data` · `src/data` · module · Src
  callers: src-core (imports), src-features (imports)
  callees: external-dependencies (imports), src-core (imports), src-lib (imports)
  tests: src/__tests__/data/patternManifest.test.ts, src/__tests__/lib/patternRegistry.test.ts, src/__tests__/shared/utils/fileLoaders.test.ts
  entry: src/data/patternManifest.ts:buildPatternManifest

- `src-features` · `src/features` · module · Src
  callers: src (imports)
  callees: external-dependencies (imports), src (imports), src-core (imports), src-data (imports), src-lib (imports), src-shared (imports)
  tests: src/__tests__/features/Header.test.tsx, src/__tests__/features/StatusBar.test.tsx, src/__tests__/features/export/browserFiles.test.ts, src/__tests__/features/export/exportAssets.test.ts, src/__tests__/features/export/finalization.test.ts
  entry: src/features/controls-panel/Controls.tsx:LeftControlsProps

- `src-lib` · `src/lib` · module · Src
  callers: src (imports), src-data (imports), src-features (imports)
  callees: external-dependencies (imports), src-core (imports)
  tests: src/__tests__/data/patternManifest.test.ts, src/__tests__/lib/patternRegistry.test.ts, src/__tests__/lib/rendering/stateProjection.test.ts, src/__tests__/lib/three/geometryFactory.test.ts, src/__tests__/lib/three/modelLoader.test.ts
  entry: src/lib/glsl/glslChunks.ts:HEADER

- `src-shared` · `src/shared` · module · Src
  callers: src (imports), src-core (imports), src-features (imports)
  callees: external-dependencies (imports), src-core (imports)
  tests: src/__tests__/setup.ts, src/__tests__/shared/ErrorBoundary.test.tsx, src/__tests__/shared/animationUtils.test.ts, src/__tests__/shared/hooks/useModalFocus.test.tsx, src/__tests__/shared/hooks/useTextureResource.test.ts
  entry: src/shared/components/ErrorBoundary.tsx:ErrorBoundary

- `src-types` · `src/types` · module · Src
  callers: (none)
  callees: (none)
  tests: (none)
  entry: src/types/version.d.ts:declare const __APP_VERSION__: string;

- `vite-config` · `vite.config.ts` · module · Vite.Config
  callers: vitest-config (imports)
  callees: external-dependencies (imports)
  tests: (none)
  entry: vite.config.ts:__dirname

- `vitest-config` · `vitest.config.ts` · module · Vitest.Config
  callers: (none)
  callees: external-dependencies (imports), vite-config (imports)
  tests: (none)
  entry: vitest.config.ts:import { defineConfig, mergeConfig } from "vitest/config";

## Edges

- index -> external-dependencies · imports
- index -> src · imports
- repository -> scripts · calls
- src -> external-dependencies · imports
- src -> src-core · imports
- src -> src-features · imports
- src -> src-lib · imports
- src -> src-shared · imports
- src-core -> external-dependencies · imports
- src-core -> src-data · imports
- src-core -> src-shared · imports
- src-data -> external-dependencies · imports
- src-data -> src-core · imports
- src-data -> src-lib · imports
- src-features -> external-dependencies · imports
- src-features -> src · imports
- src-features -> src-core · imports
- src-features -> src-data · imports
- src-features -> src-lib · imports
- src-features -> src-shared · imports
- src-lib -> external-dependencies · imports
- src-lib -> src-core · imports
- src-shared -> external-dependencies · imports
- src-shared -> src-core · imports
- vite-config -> external-dependencies · imports
- vitest-config -> external-dependencies · imports
- vitest-config -> vite-config · imports

## Unknown

- none

## Flows

- none
