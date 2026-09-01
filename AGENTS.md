# AGENTS.md

## Project Overview

Texture Genetics is a browser-based procedural texture workstation. It uses React 19, Three.js, React Three Fiber, and TypeScript 7. Node.js is the runtime. pnpm is the package manager.

## Tech Stack

- **Runtime:** Node.js >= 22
- **Package manager:** pnpm >= 12.0.0
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

## Coding Conventions

- Use strict TypeScript (strict mode enabled)
- No `@ts-ignore` — use proper types
- Feature-sliced component organization
- Components receive state as props, actions as callbacks
- Use `@/` path alias for `src/` imports
- Format with oxfmt before committing
- Keep GLSL in `.glsl` files, not inline strings

- Tests live in `src/__tests__/`. jsdom does not compile shaders or run WebGL. Exercise renderer, shader, layout, and export paths in a real browser.
- Do not hand-edit `docs/codemap/` artifacts. Read `docs/codemap/codemap.md` first. Refresh with maintain-code-map.

GitHub Issues hold live ticket state. Local mirrors live under `.scratch/`.
