# AGENTS.md

## Project Overview

EffectTextureGen is a browser-based procedural texture generation workstation. Built with React 19, Three.js (R3F), and TypeScript. Uses Bun as the package manager and runtime.

## Tech Stack

- **Runtime/Package Manager:** Bun >= 1.2
- **Framework:** React 19 + TypeScript 6.0
- **Build:** Vite 8 (Rolldown bundler)
- **Styling:** Tailwind CSS v4 (CSS-first config in `src/index.css`)
- **3D:** Three.js 0.184 + React Three Fiber + React Three Drei + Postprocessing
- **Animation:** GSAP 3.15
- **Lint/Format:** oxlint + oxfmt (OXC toolchain)
- **Testing:** Vitest 4.1 + Testing Library + jsdom

## Commands

```bash
bun run dev           # Start dev server (localhost:3000)
bun run build         # Production build
bun run lint          # Lint with oxlint
bun run lint:fix      # Lint and auto-fix
bun run fmt           # Format with oxfmt
bun run fmt:check     # Check formatting
bun run typecheck     # TypeScript type checking
bun run check         # Combined: lint + fmt:check + typecheck
bun run test          # Run tests once
bun run test:watch    # Run tests in watch mode
bun run test:coverage # Run tests with coverage
bun run clean         # Remove dist, coverage, caches, logs
```

## Project Structure

```
src/
├── core/        # Business logic, types, constants, state hooks
├── features/    # UI components by functionality (feature-sliced)
├── lib/         # Internal engines (shaders, geometry, uniforms)
├── shared/      # Shared code (hooks, UI, utils)
├── data/        # Pattern and preset definitions
└── types/       # Additional type declarations
```

## Architecture Notes

- **State management:** Custom React hooks (no external library). `useTextureEditor` is the central orchestrator. `useAppState` holds state, `useHistoryStack` provides undo/redo, `usePresetManager` handles presets via IndexedDB.
- **Shader pipeline:** GLSL shaders are assembled from chunks at runtime via `shaderBuilder.ts`. Patterns are in `data/patterns/glsl/` as `.glsl` files loaded via Vite raw imports.
- **Export:** Strategy pattern in `features/export/strategies/`. Each export format (GIF, GLB, HTML, Sprite, Video, ZIP) is an independent strategy.
- **Testing:** Tests mirror source structure in `src/__tests__/`. Uses jsdom environment. No WebGL-dependent tests currently.

## Coding Conventions

- Use strict TypeScript (strict mode enabled)
- No `@ts-ignore` — use proper types
- Feature-sliced component organization
- Components receive state as props, actions as callbacks
- Use `@/` path alias for `src/` imports
- Format with oxfmt before committing
- Keep GLSL in `.glsl` files, not inline strings
