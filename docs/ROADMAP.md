# BD3D roadmap

Each phase lands on its own branch and is reviewed before the next merges. Nothing merges into `main` without approval. Findings referenced here are in [AUDIT.md](AUDIT.md).

## Phase 1 — Foundation (this branch: `redesign/foundation`)

Goal: make the codebase reviewable, testable and safe to extend, with no visible change.

- Prettier configuration and a formatted codebase; format check in CI.
- Runtime validation of coffin data (schema + referential checks) at build/load time, with unit tests over all six editions.
- Pure logic extracted from components and unit tested: region hit test, annotation search, location cycling.
- `Exhibit.tsx` split into a state hook and focused components; `ModelRoom.tsx` split into loading, transform, camera and overlay modules.
- Verified-dead prototype code and its dependencies removed (§3.7 of the audit).
- Vitest for unit tests; Playwright channel configurable so CI can use bundled Chromium.
- GitHub Actions: format, lint, typecheck, unit tests, build, end-to-end tests.

Acceptance: all checks pass; the existing 36 end-to-end tests pass unchanged in behaviour; rendered pages match the baseline.

Risk: refactoring the exhibit can subtly change focus, keyboard or selection behaviour. Mitigation: the end-to-end suite covers these paths and runs before every commit that touches them.

## Phase 2 — Asset pipeline and performance

Goal: open an exhibit quickly and safely on phones without altering the source assets.

- Reproducible derivative pipeline: OBJ → glTF with meshopt compression; JPEG → KTX2 (Basis) textures, plus a reduced resolution tier. Originals stay in the repository as the provenance record; derivatives record their source hashes in the manifest.
- Worker-side decoding; real loading progress (bytes and stages).
- Adaptive quality: texture tier and DPR chosen from device capability, with a manual override.
- GPU resource disposal on exhibit change, verified by renderer memory counters.
- Performance budgets set from the Phase 2 measurements, enforced in CI where measurable.

Acceptance: before/after numbers for transfer size, time to model ready and estimated GPU memory on every exhibit; no visual regression in side-by-side renders; iOS Safari tested on at least one physical device.

Dependency: none. Risk: compression artefacts on inscription detail. Mitigation: per-texture visual diff at inspection zoom, and lossless fallback where artefacts appear.

## Phase 3 — Viewer core and design system

Goal: the approved mockup, built for real.

- Design tokens (colour, type, spacing, motion) and one styling approach replacing the three current ones.
- Exhibit viewer layout: full-height stage, inspector panel, toolbar, object switcher.
- Lighting and materials: physically based materials, environment lighting, tone mapping and colour management, soft contact shadow.
- Region states (idle, hover, selected, related) drawn in a single batched overlay instead of one mesh per region.
- Camera system with named commands: fly-to region, preset views (front, left, right, top), reset, framing.
- Keyboard shortcuts with a discoverable shortcut sheet.

Acceptance: matches the mockup at desktop widths, adapts on mobile, passes axe scans, frame time measured during camera flights.

Dependency: Phase 1. Phase 2 can proceed in parallel.

## Phase 4 — Research tools

Goal: features researchers would actually use, limited to what the data supports.

- Raking-light inspection with a real directional light: direction and elevation controls, presets. See the data decision below.
- Line-level interlinear display (hieroglyphs, transliteration, translation).
- Vocabulary linking: exact headword matches highlighted in transliteration lines, and each vocabulary entry's surface regions shown on the model.
- Collection-wide search across all six editions, with results that open the exhibit focused on the region.
- Deep links and shareable state: `/exhibits/[slug]?region=…&view=…&light=…`.
- Optional: side-by-side comparison of two objects; lighting presets saved per region.

Acceptance: every feature is traceable to fields in the imported data; no invented annotations, alignments or measurements.

## Phase 5 — Landing, collection and publication

- Landing page with a lightweight live 3D object; collection page; research page rewritten in the new design.
- Vercel deployment, metadata and social preview images.
- README, architecture diagram, rendering and annotation pipeline documentation, setup and testing guide, engineering decisions, before/after metrics, demo video plan, and a case study for tantan.live.

## Decisions needed

1. **High-resolution source meshes (affects Phase 4).** Real raking light can only reveal carved signs if normal maps are baked from the original high-resolution photogrammetry. Can the lab or St Andrews provide those meshes for any of the six objects? Without them, raking light ships as a relief and form tool.
2. **Model units (affects measurement).** Are the source models in metres? Measurement tools stay out until the scale is confirmed per model.
3. **Translation-word alignment.** Not in the imported data. Highlighting English words linked to signs would require new scholarly annotation; until then, linking stops at transliteration headwords and surface regions.
