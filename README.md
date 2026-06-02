# EffectTextureGen v4.0

![Version](https://img.shields.io/badge/version-4.0.0-blueviolet)
![Tech](https://img.shields.io/badge/tech-React_19_%7C_Three.js_%7C_Vite_8-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**EffectTextureGen** is a professional browser-based workstation for procedural texture generation. Designed for Technical Artists, Game Developers, and UI Designers, it enables the creation of complex graphic assets through mathematical algorithms (SDF, Noise, Fractals) without the need for heavy desktop software.

## Key Features

- **Hybrid Shader Engine:** Dynamic GLSL fragment shader compilation based on a modular "Chunks" architecture.
- **Real-Time PBR Visualization:** Instant preview with physics-based lighting (GGX), normal maps, and displacement.
- **Versatile Export:**
  - Static maps up to 4K (PNG/JPG/WEBP).
  - Automatic **Sprite Sheets** for game VFX.
  - **Video (WebM)** and **GIF** animated recording.
  - **Standalone HTML Code** and **3D GLB** export.
  - **ZIP** with all material maps.
- **Robust State Management:** Presets, History (Undo/Redo), and local persistence.
- **Layers & Compositing:** Blending procedural patterns with imported images.
- **Pattern Library:** 8 categories (abstract, fire, gradients, nature, noise, SDF, shapes, 3D).

## Tech Stack

| Category   | Tool                | Version   |
| ---------- | ------------------- | --------- |
| Runtime    | Bun                 | >= 1.2    |
| Framework  | React               | 19.x      |
| Language   | TypeScript          | 6.0.x     |
| Build      | Vite                | 8.x       |
| Bundler    | Rolldown (via Vite) | integrated |
| Styling    | Tailwind CSS        | 4.x       |
| 3D         | Three.js + R3F      | 0.184.x   |
| Animation  | GSAP                | 3.15.x    |
| Linting    | oxlint (OXC)        | 1.63.x    |
| Formatting | oxfmt (OXC)         | 0.48.x    |
| Testing    | Vitest              | 4.1.x     |

## Quick Start

```bash
# Install Bun (if not installed)
# https://bun.sh/

# Clone and install
git clone <repo-url>
cd texture-genetics
bun install

# Start dev server
bun run dev
```

The server starts at `http://localhost:3000`.

## Project Structure

```text
src/
├── core/        # Business logic, types, constants, state
├── features/    # UI components by functionality
├── lib/         # Internal engines (shaders, geometry, uniforms)
├── shared/      # Shared code (hooks, UI, utils)
├── data/        # Pattern and preset definitions
└── types/       # Additional type declarations
```

[Detailed Architecture](docs/ARCHITECTURE.md) | [Development Guide](docs/DEVELOPMENT.md)

## Quick Controls

| Action                   | Shortcut            |
| ------------------------ | ------------------- |
| Rotate camera            | Left Click          |
| Zoom                     | Mouse Wheel         |
| Pause/Resume animation   | `Space`             |
| Randomize parameters     | `R`                 |
| Undo / Redo              | `Ctrl+Z` / `Ctrl+Y` |
| Hide panels              | `H`                 |

## Available Scripts

```bash
bun run dev           # Dev server
bun run build         # Production build + logs/build.log
bun run test          # Unit tests + logs/test.log
bun run test:coverage # Coverage + logs/test-coverage.log
bun run lint          # Linting + logs/lint.log
bun run fmt           # Format code + logs/format-write.log
bun run typecheck     # Type checking + logs/typecheck.log
bun run check         # Combined checks + logs/check.log
```

## Logs & Debugging

Validation scripts write readable logs to `logs/` whether run from terminal or VS Code tasks.

- `build` → `logs/build.log`
- `lint` / `lint:fix` → `logs/lint.log` / `logs/lint-fix.log`
- `fmt` / `fmt:check` → `logs/format-write.log` / `logs/format.log`
- `typecheck` → `logs/typecheck.log`
- `test` / `test:coverage` → `logs/test.log` / `logs/test-coverage.log`
- `check` → `logs/check.log`

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — Diagram, patterns, structure
- [Development](docs/DEVELOPMENT.md) — Setup, scripts, tooling
- [Technical Debt](docs/TECHNICAL_DEBT.md) — Known issues and pending improvements
- [Changelog](docs/TASKS_COMPLETED.md) — v4.0 change history

## License

MIT
