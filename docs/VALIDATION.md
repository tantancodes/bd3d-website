# Redesign validation log

## Stage 1 — checkpoint validation

Baseline: `347364fa3ea93385795f9763d32d1754611e060a`.

- Fixed the invalid `HTMLTextArea` constructor and removed the root layout's dependency on previously generated global route types.
- Added `npm run typecheck` (`next typegen && tsc --noEmit`) and zero-warning application lint.
- Preserved Nederhof's upstream renderer unchanged and excluded that vendor source from application lint (its functions are used as browser globals).
- Replaced build-time Google font downloads with the local Geist package; corrected the circular CSS font variable.
- Ignored reproducible source HTML caches and browser reports; no local files were removed.
- `npm run typecheck`: pass.
- `npm run lint`: pass, zero warnings.
- `npm run build`: pass on Next.js 16.3.8 (Turbopack). Sandbox process restrictions required a build with local process access; no code workaround or bundler downgrade was used.
- Production HTTP smoke check: home, all six exhibit routes, and Psamtik data API returned 200. Unknown exhibit and API slugs returned 404.
- Async route params and async cookies already follow Next.js 16 conventions. This was a patch upgrade from 16.3.3, not a migration from Next.js 15.

3D interactions and visual design are not validated by this stage.

## Stage 2 — six-exhibit validation

- All six geometry/texture sets load in Chrome. Model height is normalized to four display units (not metres), with a shared source transform applied to both mesh and region vertices. Amenirdis needs the source edition's initial tilt as well as its initial camera polar angle. Its scan support/background geometry is preserved.
- Fixed missing Amenirdis Unicode transcription; imported `NewGardinerComposed.otf` from its source edition. Other editions retain the original ResLite renderer and fonts. Fixed the multi-instance script race that left later canvases blank.
- Replaced the prototype's approximate tangent-plane picker with the source viewer's nonzero projected-polygon test. A mesh ray hit and front-facing check prevent selecting empty space/back-facing regions.
- Asset readiness now waits for all textures as well as the OBJ. Geometry and texture failures surface an error; geometry retry was exercised successfully. Text remains available during failure.
- Nine browser tests pass: one comprehensive test per coffin plus delayed loading, geometry failure/retry, and texture failure. Each coffin test checks its own asset requests, rendered transcription layers, a source-derived surface click, annotation selection/camera movement, orbit drag, zoom/reset, expanded view/Escape, and repeated location navigation where the source provides it. No unrelated coffin assets were requested.
- Source integrity check passes: 37 files match recorded byte lengths and SHA-256; all 607 linked region boundaries, directions and IDs match the cached published source exactly; 314 annotation entries have valid links. Iwefaa's unlinked `face` region is not assigned an invented text.
- Desktop screenshots of all six models were inspected; Psamtik-Seneb's central-column selection was also operated and inspected in the in-app browser. These tests validate mechanics and representative mappings, not every inscription's scholarly accuracy.
- Source limitations: Amenirdis and Anonymous have no vocabulary layer; absent categories show an explicit empty state. Some mappings cover entire text sections, not individual signs. Repeated text stays one-to-many. The source Anonymous browser title conflicts with its introduction. That title is not used as an identification.
- Non-blocking upstream development warning: React Three Fiber currently constructs `THREE.Clock`, which Three r185 deprecates in favor of Timer. Rendering and interaction tests pass; the warning is not suppressed or patched in vendor code.

## Stage 3 — museum presentation

Refined editorial typography, collection cards, floating navigation, exhibit entry, dark viewing room, reading panel, responsive layouts, and reduced-motion styling. Desktop collection and mobile collection/exhibit screenshots were visually inspected; corrected floating-header centering after that inspection. Type checking, zero-warning lint and production build pass.

## Stage 4 — research and attribution

Added a server-rendered research page with six collection/edition link pairs, methodology citation (Lucarelli & Nederhof 2023, DOI 10.1163/9789004501294_011), authoring-resource link, source credits, image rights notices, import transformations, and unresolved scholarly limits. Added Matthew Whealton to the Psamtik-Seneb source credit. Corrected its material to Stone (Chrysler Museum magazine, March–April 2013, p. 4: https://chrysler.org/legacy/media/cma-mag-mar-apr-2013.pdf), removed the unsupported “painted” characterization, and aligned displayed dates with Berkeley records, retaining “probably” where the records express uncertainty. The linked official records are authoritative for historical and acquisition detail. Typecheck, lint and production build pass.

## Stage 5 — accessibility and performance

- Added keyboard focus containment/restoration for the expanded model, annotation skip link, labelled WebGL canvas, focusable reading scroll area, larger controls and high-contrast focus outlines. Tabs support arrow-key navigation.
- Resolved a reduced-motion SSR hydration mismatch using a hydration-safe external-store preference hook plus immediate CSS overrides. Automated tests now reject browser console errors in all six reduced-motion mobile exhibits.
- Stopped speculative exhibit prefetch; verified the collection requests no model, texture, annotation API, or transcription-renderer assets. Only the opened exhibit's model set loads. Next Image provides responsive collection images. Removed the unused root tooltip provider. Research content remains server-rendered.
- Enabled on-demand WebGL rendering with explicit camera-animation invalidation, capped pixel ratio at 1.5, and retained asset caching. Original textures remain uncompressed copies for provenance; no lossy 3D conversion was introduced.
- Added transcription-script failure feedback. Geometry/texture failures and loading remain covered.
- Axe WCAG A/AA scans pass on collection, research, and all six mobile exhibits. Responsive overflow/header checks cover 320, 390, 820 and 1440 px. These automated checks do not establish full accessibility certification or replace assistive-technology user testing.
- Next output traces include all six server-side annotation JSON files. npm audit reports zero vulnerabilities. Source integrity check still passes.
- Development-only upstream Three.Clock deprecation remains; dependency-owned code is unchanged. npm reports an unapproved optional install script for unrs-resolver; lint/type checking/build succeed without approving it.

## Stage 6 — final production QA

Validated the production build using `next start` on port 3100. All 36 Playwright/Chrome tests pass, covering all six exhibits individually, each exhibit's delayed loading / texture failure / geometry failure and retry, desktop interactions, mobile keyboard controls, reduced motion, collection search/filtering, no initial 3D downloads, source-page layout, unknown-route 404s, and client navigation through all six exhibits without state leakage. Axe scans report no tested WCAG A/AA violations on desktop collection/research/representative exhibit and all six mobile exhibits. The contrast scan waits for entrance animation completion rather than measuring an intermediate fade frame.

Final lint passes with zero application warnings; TypeScript/type generation, production build, source asset integrity, all 607 mapped-coordinate comparisons and `git diff --check` pass. Production route generation includes home, research, all six exhibits and the annotation API. No new environment configuration is required by these routes.

Manually inspected the home/collection and all six exhibit screenshots at desktop (1440 px) and mobile (390 px), plus the 820 px tablet viewing room and research page. Reviewed model orientation/textures, reading-panel layout, hieroglyph/transliteration presentation and responsive spacing. Operated the collection navigation in the in-app browser and confirmed the settled floating header remains centered. Automated interaction tests exercise the detailed camera and mapping behavior described above.

Known limits: original per-exhibit assets total 3.8–19.3 MiB; they are loaded on demand but not recompressed. Some scanned supports remain visible. The upstream development-only Three.Clock warning, npm optional-install-script notice, and Playwright NO_COLOR/FORCE_COLOR environment warning are non-blocking. Physical iOS/Android devices, Safari/Firefox, and screen-reader user sessions were not tested. Scholarly review is still needed for readings, uncertain identifications, source inconsistencies and per-sign interpretation; byte/coordinate equality is not scholarly certification. Full source grammatical popups are linked rather than reproduced. No mapping was fabricated.

Final checkpoint excludes local source HTML caches, dependencies, generated build/type files, and browser reports/screenshots. Earlier prototype README content is preserved in `docs/ORIGINAL-PROTOTYPE.md`; updated run instructions describe the implemented museum routes.
