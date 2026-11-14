# Agent Instructions

## Low-memory production builds

- Build only in the production web checkout with the installed Node/Next toolchain. Verify the repository root, origin, and `main` branch before deploying.
- Keep `experimental.cpus: 1` in `next.config.mjs` and use `NODE_OPTIONS=--max-old-space-size=768 RAYON_NUM_THREADS=1 pnpm exec next build --webpack`.
- If memory is still insufficient, first verify the canonical Vercel page and `/api/health` return HTTP 200. Stop only PM2 `tradepulse-web`, recheck available RAM and disk, and retry. Never stop bot/API/synthetic services or delete `.next` blindly.
- Restart `tradepulse-web` only after a successful build, then verify PM2 status and its local health endpoint. Do not use a local build as deployment evidence.
