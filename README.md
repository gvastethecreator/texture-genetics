<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/document.svg?title=Texture+Genetics&subtitle=Breed+materials.+Inspect+signals.+Export+maps.&logo=grid3x3&theme=purple&align=center&mode=dark" />
    <img alt="Texture Genetics — breed materials, inspect signals, and export maps" src="https://shieldcn.dev/header/document.svg?title=Texture+Genetics&subtitle=Breed+materials.+Inspect+signals.+Export+maps.&logo=grid3x3&theme=purple&align=center&mode=light" />
  </picture>
</p>

<p align="center">
  <a href="https://github.com/gvastethecreator/texture-genetics/actions/workflows/validate.yml"><img alt="Validation status" src="https://shieldcn.dev/github/ci/gvastethecreator/texture-genetics.svg?workflow=validate&branch=main&variant=secondary&size=xs" /></a>
  <a href="https://gvastethecreator.github.io/texture-genetics/"><img alt="Live workstation" src="https://shieldcn.dev/badge/live-workstation-6c5ce7.svg?logo=githubpages&variant=branded&size=xs" /></a>
  <a href="https://pnpm.io/"><img alt="pnpm 12.0.0" src="https://shieldcn.dev/badge/pnpm-12.0-f69220.svg?logo=pnpm&variant=secondary&size=xs" /></a>
  <a href="#what-it-does"><img alt="WebGL 2 and WebGPU" src="https://shieldcn.dev/badge/render-WebGL2%20%2B%20WebGPU-1f8f75.svg?variant=secondary&size=xs" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://shieldcn.dev/github/license/gvastethecreator/texture-genetics.svg?variant=secondary&size=xs" /></a>
</p>

Browser workstation for procedural textures, animated materials, and PBR-ready exports.

[Live workstation](https://gvastethecreator.github.io/texture-genetics/) · [Get started](#start) · [Documentation](#documentation) · [Contributing](CONTRIBUTING.md) · [Sponsor](https://github.com/sponsors/gvastethecreator)

Texture Genetics runs a hybrid TSL/GLSL pipeline in React and Three.js. It targets
technical artists, game developers, and UI designers who need to build and export
textures without a desktop DCC tool.

## Product tour

These captures come from the production build running its real WebGL texture pipeline. They show active controls, presets, and responsive behavior rather than presentation mockups.

| Texture workbench | Rusted Metal preset |
| --- | --- |
| ![Texture Genetics workbench with a live procedural texture and editing panels](docs/assets/screenshots/texture-workbench.png) | ![Rusted Metal preset with Grunge controls and export panel](docs/assets/screenshots/rusted-metal-preset.png) |
| **Global settings** | **Mobile workbench** |
| ![Global settings dialog for renderer quality and export format](docs/assets/screenshots/global-settings.png) | ![Caribbean Pool preset running in the responsive mobile workbench](docs/assets/screenshots/mobile-workbench.png) |

## What it does

- Real-time WebGPU/WebGL preview with procedural TSL and GLSL patterns
- PBR material controls, normal maps, displacement, masks, and layered stickers
- Built-in geometry, text, SVG, OBJ, glTF, and GLB preview
- Presets, undo/redo, IndexedDB persistence, and responsive editor panels
- PNG, JPG, WebP, GIF, WebM, sprite sheet, GLB, HTML, and ZIP exports
- Lazy-loaded exporters with build-size and coverage gates

## Start

Requirements: Node.js 22 or newer, pnpm 12.0.0 or newer, and Git.

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
- [Changelog](docs/CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](.github/SECURITY.md)

## Project status

- React 19, Three.js 0.185, Vite 8, Tailwind CSS 4, TypeScript 7, Node.js 22+, and pnpm 12.0.0
- Direct dependencies match their latest published versions as of 2026-08-15
- CI validates formatting, lint, types, coverage thresholds, and production build
- Browser target: current Chromium, Firefox, and Safari with WebGL 2 or WebGPU

## Support

If Texture Genetics helps your art or game pipeline, you can [sponsor continued development](https://github.com/sponsors/gvastethecreator) or [buy the maintainer a coffee](https://ko-fi.com/gvaste). Focused bug reports and improvements are welcome through [GitHub Issues](https://github.com/gvastethecreator/texture-genetics/issues) and [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
