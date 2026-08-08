# EffectTextureGen

Browser workstation for procedural textures, animated materials, and PBR-ready exports.

> [Live demo](https://gvastethecreator.github.io/texture-genetics/)

EffectTextureGen runs a hybrid TSL/GLSL pipeline in React and Three.js. It targets
technical artists, game developers, and UI designers who need to build and export
textures without a desktop DCC tool.

## What it does

- Real-time WebGPU/WebGL preview with procedural TSL and GLSL patterns
- PBR material controls, normal maps, displacement, masks, and layered stickers
- Built-in geometry, text, SVG, OBJ, glTF, and GLB preview
- Presets, undo/redo, IndexedDB persistence, and responsive editor panels
- PNG, JPG, WebP, GIF, WebM, sprite sheet, GLB, HTML, and ZIP exports
- Lazy-loaded exporters with build-size and coverage gates

## Start

Requirements: Node.js 22 or newer, pnpm 11.20 or newer, and Git.

```bash
git clone https://github.com/gvastethecreator/texture-genetics.git
cd texture-genetics
pnpm install --frozen-lockfile
pnpm run dev
```

Open `http://localhost:3000`.

## Main commands

```bash
pnpm run dev           # Development server
pnpm run check         # Lint, format check, and typecheck
pnpm run test          # Test suite
pnpm run test:coverage # Tests plus coverage thresholds
pnpm run build         # Production build plus bundle budgets
pnpm run clean         # Remove generated output and logs
```

VS Code exposes the same commands through short emoji tasks in
[`.vscode/tasks.json`](.vscode/tasks.json).

## Documentation

- [Setup and deployment](docs/SETUP.md)
- [Development workflow](docs/DEVELOPMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Component map](docs/COMPONENT_MAP.md)
- [Technical reference](docs/REFERENCE.md)
- [Technical debt](docs/TECHNICAL_DEBT.md)
- [v4 migration history](docs/TASKS_COMPLETED.md)
- [Security policy](.github/SECURITY.md)

## Project status

- React 19, Three.js 0.185, Vite 8, Tailwind CSS 4, Node.js 22, and pnpm 11.20
- TypeScript 6.0 remains pinned while the TypeScript 7 native compiler issue is tracked
- CI validates formatting, lint, types, coverage thresholds, and production build
- Browser target: current Chromium, Firefox, and Safari with WebGL 2 or WebGPU

## License

MIT. See [LICENSE](LICENSE).
