# EffectTextureGen

Browser-based procedural texture generation workstation.

EffectTextureGen is a workstation for technical artists, game developers, and
UI designers who need PBR-ready procedural textures, normal maps, and animated
materials without leaving the browser. It runs on Three.js (TSL + GLSL) inside
a React 19 + Vite 8 app and exports to PNG/JPG/WEBP, GLB, animated GIF, WebM,
sprite sheets, standalone HTML, and ZIP.

## Features

- Hybrid TSL/GLSL shader engine with a modular chunk system
- Real-time PBR preview (GGX lighting, normal maps, displacement)
- Pattern library: abstract, fire, gradients, nature, noise, SDF, shapes (7 categories)
- Layered compositing with masks, base textures, and stickers
- Undo/redo, presets, and IndexedDB persistence
- Strategy-pattern export pipeline: image, sprite sheet, video, GIF, GLB, HTML, ZIP
- Lazy-loaded modals and chunk-split bundles for fast first paint

## Quick Start

```bash
# Requires Bun >= 1.2 (https://bun.sh)
git clone <repo-url>
cd texture-genetics
bun install
bun run dev
```

Open `http://localhost:3000` and start generating.

## Quick Controls

| Action                | Shortcut            |
| --------------------- | ------------------- |
| Pause / resume        | `Space`             |
| Randomize             | `R`                 |
| Undo / redo           | `Ctrl+Z` / `Ctrl+Y` |
| Toggle side panels    | `H`                 |

The full shortcut list is in the in-app `?` modal.

## Documentation

- Setup and scripts: [`docs/SETUP.md`](docs/SETUP.md)
- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Component map: [`docs/COMPONENT_MAP.md`](docs/COMPONENT_MAP.md)
- Reference (stack, shortcuts, logs): [`docs/REFERENCE.md`](docs/REFERENCE.md)
- Technical debt: [`docs/TECHNICAL_DEBT.md`](docs/TECHNICAL_DEBT.md)
- Changelog: [`docs/TASKS_COMPLETED.md`](docs/TASKS_COMPLETED.md)
- Agent instructions: [`AGENTS.md`](AGENTS.md)

## Status

- v4.0 runtime is TSL-first; a GLSL fallback remains for the legacy HTML export.
- WebGL 2 / WebGPU preview. Some post-processing paths degrade gracefully when
  WebGPU is unavailable.
- Test coverage is partial (~16%). The shared hooks, pattern registry, and
  primitives are tested. Shader and export paths need additional test infra.
- Browser support targets evergreen Chromium, Firefox, and Safari.

## License

MIT — see [`LICENSE`](LICENSE).
