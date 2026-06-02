# Setup

This project uses **Bun** as the package manager and runtime. Node.js >= 22 is
recommended for compatibility with native modules some tools depend on.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.2
- Node.js >= 22
- Git

## Install

```bash
git clone <repo-url>
cd texture-genetics
bun install
```

## Available Scripts

All scripts log to `logs/<name>.log` in addition to stdout.

| Script                  | Description                                               |
| ----------------------- | --------------------------------------------------------- |
| `bun run dev`           | Vite dev server with HMR on `http://localhost:3000`       |
| `bun run build`         | Production build to `dist/`                               |
| `bun run preview`       | Preview the production build locally                      |
| `bun run lint`          | oxlint over `src/`                                        |
| `bun run lint:fix`      | oxlint with auto-fix                                      |
| `bun run fmt`           | oxfmt write mode over `src/**/*.{ts,tsx}`                 |
| `bun run fmt:check`     | oxfmt check mode                                          |
| `bun run typecheck`     | `tsc --noEmit`                                            |
| `bun run test`          | Vitest single run                                         |
| `bun run test:watch`    | Vitest watch mode                                         |
| `bun run test:coverage` | Vitest with v8 coverage                                   |
| `bun run check`         | Combined: `lint` + `fmt:check` + `typecheck`              |
| `bun run clean`         | Remove `dist/`, `coverage/`, `.vite/`, and log files      |

## Validation Logs

| Script                | Log file                       |
| --------------------- | ------------------------------ |
| `dev`                 | (no log, watch process)        |
| `build`               | `logs/build.log`               |
| `lint` / `lint:fix`   | `logs/lint.log` / `lint-fix.log` |
| `fmt` / `fmt:check`   | `logs/format-write.log` / `format.log` |
| `typecheck`           | `logs/typecheck.log`           |
| `test` / `coverage`   | `logs/test.log` / `test-coverage.log` |
| `check`               | `logs/check.log`               |

## VS Code Tasks

`Ctrl+Shift+P` → **Tasks: Run Task** exposes the same scripts with emoji labels
(`Dev`, `Build`, `Lint`, `Test`, `Typecheck`, `Format`, `Coverage`, `Preview`,
`Clean`, `Install`). Tasks delegate to the npm scripts above, so logs land in
the same files.

## Testing

Tests live in `src/__tests__/`, mirroring the source structure. The
`patternRegistry` test guards the contract between `TextureType`, UI categories,
shader labels, GLSL patterns, and TSL pattern registration.

```bash
bun run test              # Run once
bun run test:watch        # Watch mode
bun run test:coverage     # With coverage (v8 provider, output in `coverage/`)
```

There are no WebGL-dependent tests in the current suite; complex paths
(shader pipeline, export, canvas) need additional infrastructure to test
deterministically.

## Tailwind CSS v4

This project uses Tailwind v4 with the **CSS-first configuration** approach.
All design tokens are defined in `src/index.css` using the `@theme` directive:

```css
@theme {
  --color-bg: #050505;
  --color-panel: #080808;
  --font-sans: "Archivo", sans-serif;
  --shadow-tactile: ...;
  --animate-shimmer: ...;
}
```

Custom utilities use `@utility`. See `src/index.css` for the full token set.

## Build Output

`bun run build` produces `dist/` with:

- Chunk splitting: `vendor`, `three`, `react-three`, `vendor-other`
- ES2022 target
- Source maps disabled in production
