# AGENTS.md

## Project Overview

Texture Genetics is a browser-based procedural texture workstation. It uses React 19, Three.js, React Three Fiber, and TypeScript 7. Node.js is the runtime. pnpm is the package manager.

## Tech Stack

- **Runtime:** Node.js >= 22
- **Package Manager:** pnpm >= 11.20
- **Framework:** React 19 + TypeScript 7.0
- **Build:** Vite 8 (Rolldown bundler)
- **Styling:** Tailwind CSS v4 (CSS-first config in `src/index.css`)
- **3D:** Three.js 0.185 + React Three Fiber + React Three Drei + Postprocessing
- **Lint/Format:** oxlint + oxfmt (OXC toolchain)
- **Testing:** Vitest 4.1 + Testing Library + jsdom

## Commands

```bash
pnpm run dev           # Start dev server (localhost:3000)
pnpm run build         # Production build
pnpm run lint          # Lint with oxlint
pnpm run lint:fix      # Lint and auto-fix
pnpm run fmt           # Format with oxfmt
pnpm run fmt:check     # Check formatting
pnpm run typecheck     # TypeScript type checking
pnpm run check         # Combined: lint + fmt:check + typecheck
pnpm run test          # Run tests once
pnpm run test:watch    # Run tests in watch mode
pnpm run test:coverage # Run tests with coverage
pnpm run clean         # Remove dist, coverage, caches, logs
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
