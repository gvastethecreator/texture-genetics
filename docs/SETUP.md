# Setup and deployment

## Requirements

- Node.js 22 or newer
- pnpm 12.0.0 or newer
- Git
- A current browser with WebGL 2 or WebGPU

Node.js is the runtime used by the project scripts and Vite toolchain.

## Install

```bash
git clone https://github.com/gvastethecreator/texture-genetics.git
cd texture-genetics
pnpm install --frozen-lockfile
pnpm run dev
```

Development server: `http://localhost:3000`.

Use `pnpm install --no-frozen-lockfile` only when intentionally changing
dependencies. Commit `package.json` and `pnpm-lock.yaml` together.

## Local production check

```bash
pnpm run check
pnpm run test:coverage
pnpm run build
pnpm run preview
```

`build` writes `dist/`, validates entry/Three.js/initial JavaScript budgets, and
confirms heavy exporters remain deferred. `preview` serves the built app on port 3000.

## Generated files

The cleanup command removes these generated paths:

- `node_modules/`
- `dist/`
- `coverage/`
- `logs/*.log`
- `.vite/`

Remove generated output with:

```bash
pnpm run clean
```

Local tool state under `.local/`, `.scratch/`, `.agents/`, and `.playwright-mcp/`
is ignored. Remove stale tool output only after you make sure that no active task uses it.

## GitHub Pages

The app is a static SPA. `.github/workflows/deploy-pages.yml` builds and publishes
`dist/` on pushes to `main` or manual dispatch.

Pipeline:

1. `pnpm install --frozen-lockfile`
2. `pnpm run build`
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
