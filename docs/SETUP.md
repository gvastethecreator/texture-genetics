# Setup and deployment

## Requirements

- [Bun](https://bun.sh/) 1.3 or newer
- Git
- A current browser with WebGL 2 or WebGPU

Node.js is useful for editor tooling but is not required for the normal Bun workflow.

## Install

```bash
git clone https://github.com/gvastethecreator/texture-genetics.git
cd texture-genetics
bun install --frozen-lockfile
bun run dev
```

Development server: `http://localhost:3000`.

Use `bun install` without `--frozen-lockfile` only when intentionally changing
dependencies. Commit `package.json` and `bun.lock` together.

## Local production check

```bash
bun run check
bun run test:coverage
bun run build
bun run preview
```

`build` writes `dist/`, validates entry/Three.js/initial JavaScript budgets, and
confirms heavy exporters remain deferred. `preview` serves the built app on port 3000.

## Generated files

These paths are local and ignored:

- `node_modules/`
- `dist/`
- `coverage/`
- `logs/*.log`
- `.vite/`
- `.local/`, `.scratch/`, `.agents/`, and `.playwright-mcp/`

Remove generated output with:

```bash
bun run clean
```

## GitHub Pages

The app is a static SPA. `.github/workflows/deploy-pages.yml` builds and publishes
`dist/` on pushes to `main` or manual dispatch.

Pipeline:

1. `bun install --frozen-lockfile`
2. `bun run build`
3. Upload `dist/` as the Pages artifact
4. Deploy to the `github-pages` environment

One-time repository setup: **Settings → Pages → Build and deployment → GitHub Actions**.

The Vite base path is `/texture-genetics/`. Forks or repository renames must update
`repoBase` in `vite.config.ts`. `public/404.html` redirects deep links to the SPA root.

## Runtime limits

- User state and presets are browser-local. Clearing site data removes them.
- Export important presets before clearing storage or switching browsers.
- WebGPU is preferred when available; supported paths fall back to WebGL.
- TextGeometry fonts ship in `public/fonts/three/` so text preview does not depend
  on a third-party runtime CDN.
