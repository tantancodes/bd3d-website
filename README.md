# The Book of the Dead in 3D

A museum-style collection and reading interface for six published Egyptian coffin models. This branch redesigns the UC Berkeley project prototype while preserving links to the scholarly editions and collection records.

## Run

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The six exhibits and research page do not require environment variables or a database; the museum routes use checked-in source snapshots.

### Checks

```sh
npm run check          # format, lint, types, unit tests
npm run verify:data    # asset sizes and SHA-256 against the import manifest
npm run build
npm run start -- --port 3101
npm run test:e2e       # Playwright, expects the server on :3101
```

Browser tests use installed Google Chrome by default. Without Chrome, or on a machine without a GPU (as in CI), use bundled Chromium with software WebGL and a longer readiness timeout:

```sh
npx playwright install chromium
PLAYWRIGHT_CHANNEL= PLAYWRIGHT_SOFTWARE_GL=1 PLAYWRIGHT_EXPECT_TIMEOUT=45000 npm run test:e2e
```

Reports and screenshots are written to the ignored `playwright-report/` and `test-results/` directories. CI runs every check on each push (`.github/workflows/ci.yml`).

## Architecture

- Next.js 16 / React 19 / TypeScript; statically generated exhibit pages. Edition data is validated against a schema and link checks at build time.
- React Three Fiber / Three.js / Drei; OBJ + MTL + original textures loaded only for the opened exhibit, with on-demand rendering.
- Source surface polygons connect to transcriptions, transliterations, translations, interpretation and vocabulary entries. One display transform is shared by the mesh and the region coordinates.
- Scene math (orientation, hit testing, camera poses) and annotation logic are pure, unit-tested modules in `lib/`; components in `app/components/viewer` and `app/components/exhibit` compose them.

Details: [architecture](docs/ARCHITECTURE.md) · [audit and baseline](docs/AUDIT.md) · [roadmap](docs/ROADMAP.md).

## Source data and editorial limits

`data/coffins/` contains 314 extracted entries and 607 linked regions. `data/import-manifest.json` records source URLs, byte sizes and SHA-256 hashes for models, textures, renderer, fonts, and source HTML. `data/photography-manifest.json` records the original collection photographs.

`scripts/import-nederhof.mjs` imports the published St Andrews editions. It parses recognized source calls without executing remote JavaScript. `scripts/import-photography.mjs` creates resized collection images. Re-running an importer changes scholarly snapshots and must be reviewed. Downloaded HTML caches in `data/sources/` remain local and ignored; source-coordinate comparison runs when those caches are present. Asset integrity can be verified from a clean checkout.

The research page explains methodology, credits, transformations, and uncertainties. Missing mappings are not invented. Full source grammatical popups and critical apparatus remain in the linked original editions. Display scale is not physical measurement. Original model sets are 3.8–19.3 MiB each; lower-bandwidth derivatives would require a separate, provenance-preserving asset pipeline.

See [validation and known issues](docs/VALIDATION.md). The earlier prototype README is preserved in [original architecture notes](docs/ORIGINAL-PROTOTYPE.md).
