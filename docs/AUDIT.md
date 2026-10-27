# BD3D technical audit and baseline

Audited commit: `70518e6` (`codex/museum-exhibit-redesign`), 23 Oct 2026.
Raw baseline numbers: [`docs/metrics/baseline.json`](metrics/baseline.json).

This document records what the codebase is today, what was measured, and which problems the roadmap addresses. Statements about performance are measurements unless marked as estimates.

## 1. What exists

| Area        | Current state                                                                                                                                                                                                                                                        |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework   | Next.js 16.3 App Router, React 19.2, TypeScript (`strict: true`)                                                                                                                                                                                                     |
| Routes      | `/` (static), `/research` (static), `/exhibits/[slug]` (6 SSG pages), `/api/coffins/[slug]` (dynamic JSON)                                                                                                                                                           |
| 3D          | three r185, React Three Fiber 9, drei 10. OBJ + MTL + JPEG textures via a custom `CoffinLoader`                                                                                                                                                                      |
| Data        | 6 JSON files in `data/coffins/`: 314 annotation entries, 607 surface regions, 140 linguistic fragments. Imported from Nederhof's published St Andrews editions by `scripts/import-nederhof.mjs`; integrity checked by `scripts/verify-import.mjs` (SHA-256 manifest) |
| Hieroglyphs | Nederhof's ResLite renderer (`public/vendor/nederhof/reslite.js`) drawing to canvas; Unicode + composed font for Amenirdis                                                                                                                                           |
| Tests       | 36 Playwright end-to-end tests (Chrome channel). No unit tests. No CI                                                                                                                                                                                                |
| Styling     | Three systems at once: Tailwind 4 + shadcn tokens (`globals.css`), `museum.css` (23 KB on 19 lines), `exhibit.css`                                                                                                                                                   |

The data pipeline and provenance work are the strongest parts of the project: every region and entry traces to a source file with a checksum, and missing mappings are left empty rather than invented.

## 2. Baseline measurements

Environment: headless Chromium on a 2-vCPU Xeon, WebGL via SwiftShader (CPU), localhost, cache disabled. Absolute times are pessimistic compared with a real GPU; they are used to compare before and after, not as user-facing claims.

| Route                    | Transfer |     JS | Model ready |
| ------------------------ | -------: | -----: | ----------: |
| `/`                      |  0.57 MB | 193 KB |           — |
| `/research`              |  0.35 MB | 193 KB |           — |
| `/exhibits/psamtikseneb` | 20.25 MB | 450 KB |       8.7 s |
| `/exhibits/irethoreru`   | 15.42 MB | 450 KB |       8.2 s |
| `/exhibits/iwefaa2`      | 14.16 MB | 450 KB |       5.7 s |
| `/exhibits/anonymous1`   |  4.76 MB | 450 KB |       2.8 s |
| `/exhibits/amenirdis`    |  8.62 MB | 450 KB |       7.1 s |
| `/exhibits/psamtik`      | 19.00 MB | 450 KB |       7.7 s |

Per-asset findings:

| Measure            | Value                                                                          | Source                                |
| ------------------ | ------------------------------------------------------------------------------ | ------------------------------------- |
| OBJ geometry size  | 2.0–3.4 MB of text per model, served uncompressed by `next start`              | network trace                         |
| OBJ parse time     | 114–234 ms median per model, single thread                                     | Node, three `OBJLoader.parse`, 5 runs |
| Textures           | 21 JPEGs, every one 4096 × 4096; four per model except `anonymous1`            | file inspection                       |
| GPU texture memory | ≈341 MB per four-texture exhibit (RGBA8 + mipmaps)                             | **estimate** from dimensions          |
| Hieroglyph font    | `NewGardiner.ttf` 580 KB loaded on every exhibit                               | network trace                         |
| Mesh density       | 20k–50k triangles; mean edge length 1/84 to 1/166 of the object's longest side | computed from OBJ vertices            |
| Production build   | 36 s                                                                           | `npm run build`                       |

Baseline test run: with the suite's default 5 s assertion timeout, 19 of 36 tests fail in this environment, all at the same assertion (`data-model-ready="true"`), because model readiness takes 2.8–8.7 s on CPU rendering. See §6.

## 3. Architecture findings

1. **One component owns the whole exhibit.** `app/components/Exhibit.tsx` (≈600 lines once formatted) holds 15 pieces of state, keyboard handling, a focus trap, search, tabs, camera commands, location cycling and all markup. Nothing in it can be tested in isolation.
2. **Rendering, camera, picking and overlays share one component.** `ModelRoom.tsx` combines asset loading, the source-orientation transform, camera flights, region picking and overlay drawing. These are the systems the roadmap extends, so they need clear boundaries first.
3. **Implicit camera API.** Camera actions are sent as `{kind, serial}` objects whose serial number forces effects to re-run. It works but hides intent and makes new commands (fly-to, saved views, lighting) awkward.
4. **No runtime validation of research data.** `lib/coffin-data.ts` does `JSON.parse` and casts to `CoffinData`. A malformed import would fail at render time inside the 3D scene.
5. **Credits are hard-coded in UI code** (`coffin.slug === 'psamtikseneb' ? ', Matthew Whealton' : ''`). Scholarly attribution belongs in the data.
6. **Code style.** Most application files are written as dense one-liners (multiple `useState` calls per statement, whole functions on one line, minified CSS). There is no formatter configuration. This is the single biggest obstacle for anyone reviewing the code.
7. **Dead prototype code, verified unused by every route and test:**
   - `app/components/ArtifactExperience.tsx` and `CoffinViewer.tsx` import only each other. `CoffinViewer` renders `public/models/dog.glb`, a 10 MB placeholder model.
   - `components/ui/*` (5 shadcn components) are imported only by `ArtifactExperience`.
   - `lib/supabase/*` is imported by nothing; `lib/utils.ts` only by `components/ui`.
   - `public/{file,globe,next,vercel,window}.svg`, `public/images/sarco.png` and `public/images/bd3d-logo.png` are referenced nowhere.
   - Dependencies used only by the above: `@supabase/ssr`, `@supabase/supabase-js`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`.

## 4. Rendering findings

1. **Main-thread work on open.** OBJ text parsing (≈0.1–0.2 s) and decoding four 16-megapixel JPEGs happen on the main thread before the first frame.
2. **Texture memory is the biggest mobile risk.** ≈341 MB of estimated GPU texture memory per exhibit is above what iOS Safari tolerates on many devices, where the usual failure is a reloaded or blank tab. Not yet verified on a device.
3. **Uncompressed transfer.** OBJ is text and `next start` does not compress it. A binary, quantized format would be several times smaller regardless of host.
4. **Lighting and materials.** Ambient light at 1.6 plus two directional lights over MTL-derived Phong materials, no shadows, no environment, default tone mapping. This is why the models look flat.
5. **Overlay cost.** Each region is its own drei `Line` (a separate mesh, material and draw call), rebuilt from fresh `Vector3`s on every render. Psamtik-Seneb draws 94; Irethoriru 265.
6. **Per-frame DOM writes.** `useFrame` writes two `data-*` attributes every frame for test hooks.
7. **Good existing choices to keep:** on-demand rendering (`frameloop="demand"`), DPR capped at 1.5, exhibit assets loaded only for the opened exhibit, the exact screen-space polygon hit test ported from the source viewer.

## 5. Research-data findings that constrain features

These decide what the viewer can honestly offer.

1. **Raking light cannot reveal carved signs on the current meshes.** Mean edge length is 1/84 to 1/166 of each object's longest side. If the source units are metres (the longest sides are 1.6–2.5, which fits coffins, but the units are not documented), edges are 1.3–2.7 cm long, while carved strokes are millimetres. The inscriptions exist in the textures, not the geometry. A real 3D light will show large-scale relief (faces, wigs, collars, lid curvature) but not individual signs.
   - **Option A (no new data):** real directional light with presets. Honest, useful for form, modest for reading.
   - **Option B (recommended, needs data):** obtain the high-resolution photogrammetry meshes and bake normal maps onto the existing low-poly meshes. Real measured geometry, small download, and raking light then genuinely reveals carving.
   - **Rejected:** estimating relief from texture brightness (shape-from-shading). That would display surface detail that was never measured.
2. **Measurement needs a verified scale.** The research page already states that display units are not measurements. A measuring tool requires confirmed source units per model.
3. **Word-level linking is partial.** Fragments are line-level (hieroglyphs, transliteration and translation per clause). Vocabulary entries carry their own surface regions (for example ꜣḫt "horizon" has two on Psamtik-Seneb), and a vocabulary headword can be matched exactly to tokens in a transliteration line. There is no alignment between translation words and transliteration words, so highlighting an English word cannot be supported without new scholarly data.

## 6. Testing findings

- End-to-end coverage of behaviour is good: every exhibit's loading, failure, retry, picking, camera, layers, keyboard and reduced-motion paths are exercised. These tests are the safety net for the refactor.
- No unit tests for pure logic (hit test, data integrity, search, location cycling).
- No CI; tests require a locally installed Chrome (`channel: 'chrome'`).
- The 5 s assertion timeout assumes a GPU. On CPU rendering, model readiness takes 2.8–8.7 s, so the suite is environment-sensitive. The fix is a readiness timeout sized to the measured worst case, not shorter loading claims.
