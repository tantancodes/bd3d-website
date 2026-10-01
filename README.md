# The Book of the Dead in 3D

A museum-style collection and reading interface for six published Egyptian coffin models. This branch redesigns the UC Berkeley project prototype while preserving links to the scholarly editions and collection records.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The six exhibits and research page do not require environment variables or a database. Existing Supabase helpers and earlier prototype components remain in the repository; the museum routes use checked-in source snapshots.

```sh
npm run lint
npm run typecheck
npm run build
npm run start -- --port 3100
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100 npx playwright test
node scripts/verify-import.mjs
```

Browser tests use installed Google Chrome (`channel: 'chrome'`). Reports and screenshots are written to ignored `playwright-report/` and `test-results/` directories. Test failures must be investigated before release.

## Architecture

- Next.js 16 / React 19 / TypeScript; statically generated exhibit pages and server-side annotation loading.
- React Three Fiber / Three.js / Drei; OBJ + MTL + original textures loaded only for the opened exhibit, with on-demand rendering.
- Source surface polygons connect to transcriptions, transliterations, translations, interpretation, and vocabulary entries. Camera and polygon transforms share the model’s source orientation and normalization.
- Motion and CSS provide restrained transitions, with hydration-safe reduced-motion handling.
- Responsive Next Image photography and self-hosted Geist fonts; server-rendered research/provenance content.

## Source data and editorial limits

`data/coffins/` contains 314 extracted entries and 607 linked regions. `data/import-manifest.json` records source URLs, byte sizes and SHA-256 hashes for models, textures, renderer, fonts, and source HTML. `data/photography-manifest.json` records the original collection photographs.

`scripts/import-nederhof.mjs` imports the published St Andrews editions. It parses recognized source calls without executing remote JavaScript. `scripts/import-photography.mjs` creates resized collection images. Re-running an importer changes scholarly snapshots and must be reviewed. Downloaded HTML caches in `data/sources/` remain local and ignored; source-coordinate comparison runs when those caches are present. Asset integrity can be verified from a clean checkout.

The research page explains methodology, credits, transformations, and uncertainties. Missing mappings are not invented. Full source grammatical popups and critical apparatus remain in the linked original editions. Display scale is not physical measurement. Original model sets are 3.8–19.3 MiB each; lower-bandwidth derivatives would require a separate, provenance-preserving asset pipeline.

See [validation and known issues](docs/VALIDATION.md). The earlier prototype README is preserved in [original architecture notes](docs/ORIGINAL-PROTOTYPE.md).
