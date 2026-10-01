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
