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
