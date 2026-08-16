# Contributing

Thank you for helping improve Texture Genetics. Keep changes focused, preserve browser compatibility, and treat a successful build as separate from real renderer evidence.

## Development setup

Requirements:

- Node.js 22 or newer
- pnpm 11.21

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:coverage
pnpm run build
```

Run `pnpm run dev` for interactive work. Exercise the affected texture, renderer, storage, or export path in a real browser when a change touches it.

## Pull requests

- Describe the user-visible or pipeline outcome.
- Add or update the nearest existing test when behavior changes.
- Include browser evidence for shader, WebGL/WebGPU, layout, or export changes.
- Keep screenshots and sample projects free of private data and unlicensed assets.
- Run the applicable gates and `git diff --check` before requesting review.
- Do not commit caches, generated logs, or build output.

By contributing, you agree that your work is provided under the repository license.
