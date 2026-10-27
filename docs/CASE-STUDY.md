# BD3D: reading ancient Egyptian coffins in three dimensions

_Case study for tantan.live. Research platform built for the UC Berkeley Book of the Dead in 3D project._

## The problem

Egyptian coffins were written to be read in place. A spell's position on the lid, the sides or the foot end is part of its meaning. Printed editions separate text from object, and photographs flatten it.

The Berkeley project had already done the hard scholarly work: photogrammetric models of six coffins in three museums, and annotation editions by Rita Lucarelli, Kea Johnston and Mark-Jan Nederhof that tie 314 entries (inscriptions, interpretive notes, vocabulary) to 607 regions drawn on the models. The question was how to make that work fast, legible and useful for someone exploring it, on a laptop or a phone.

## What I built

A web application where you turn a coffin, click any outlined region to read what is written there, and go the other way: from a line of text to its place on the object.

- **Exhibit viewer:** full-height 3D stage with an inspector panel: object label, inscriptions, interpretive notes and vocabulary, each as interlinear hieroglyphs, transliteration and translation.
- **Bidirectional linking:** hovering a region highlights its entry; hovering an entry highlights its regions; selecting either flies the camera to the recorded viewing direction.
- **Vocabulary from the text:** words in a transliteration link to the edition's dictionary entries by exact spelling and show every place the word occurs on the object.
- **Raking light:** a real directional light at a chosen angle, with shadow maps, to read the relief of the scanned geometry.
- **Collection search:** all 314 entries across six objects; each result opens the coffin at the right spot.
- **Shareable state:** the URL captures the selected region, view and light, so a reading can be sent to a colleague.
- **Keyboard-first:** every camera action has a button and a shortcut.

## Engineering

**Stack:** Next.js 16, React 19, TypeScript (strict), React Three Fiber and three.js, zod, Vitest, Playwright, GitHub Actions.

**Research data as code.** The imported editions are validated against a schema and referential checks at build time: every region must point to an entry that points back. A broken import fails the build instead of the 3D scene.

**An asset pipeline with provenance.** The source models are 2–3 MB OBJ text files and four 4096² JPEGs each. A build script converts them to meshopt-compressed, 16-bit quantized glTF and smaller WebP texture tiers, without moving a vertex. Every derivative records its hash and the hash of its source, and a unit test checks each compressed model against the original's bounds to within 1/10,000 of its length. The originals stay in the repository untouched.

**Progressive, device-aware loading.** Geometry and small textures load first, with a progress bar showing real bytes, so the object appears in about a second or two. The final texture resolution is chosen from the device (GPU texture limits, memory, connection, touch input) and loaded in the background. GPU memory is released when you leave an exhibit.

**Picking that matches the scholarship.** Region selection reuses the source viewer's own projected-polygon rule rather than approximating it, so what you click is exactly what the editors drew. Hover uses the same rule without raycasting the 50,000-triangle meshes on every mouse move, and all outlines are drawn in at most four batched draw calls instead of one per region.

**Testing.** 82 unit tests cover the data, the geometry math and the search and linking logic. 46 end-to-end tests drive every exhibit in a real browser: loading, failure and retry, clicking the model, camera controls, deep links, vocabulary links, raking light and accessibility scans. CI runs all of it on every push.

## Measured results

Before and after, same harness, median of three runs (full tables in [PERFORMANCE.md](PERFORMANCE.md)):

- Download for an exhibit at standard quality: **4.8–20.2 MB → 1.9–6.1 MB**.
- Geometry: **1.9–3.3 MB → 0.4–1.0 MB**; parsing **82–132 ms → 2–3 ms**.
- Estimated GPU texture memory on phones and tablets: **≈341 MB → ≈85 MB** per exhibit.
- First frame with the model: **1.8–4.2 s → 0.9–1.8 s** in a software-rendered test browser.
- Open issue: in that software renderer, reaching full-resolution textures is slower than before. Profiled, partly mitigated, and not yet measured on GPU hardware.

## Scientific restraint

Three features were deliberately limited by the data:

- **Raking light** reveals form and relief, not individual signs. The meshes are too coarse to hold carving (mean edge length 1/84 to 1/166 of the object), so the inscriptions live in the photographs. The interface says so. Estimating relief from the photographs was rejected, because it would display detail nobody measured.
- **No measurement tools.** The models' physical units are not documented.
- **No English word alignment.** The editions link words to the object and to dictionary entries, not to words in the translation, so the interface links only what the data links.

Each of these is listed on the research page with the data that would unlock it.

## What I would do next

- Bake normal maps from the high-resolution photogrammetry, if the lab can share it, so raking light reveals carving.
- Test on physical iOS and Android devices and set performance budgets from those measurements.
- Comparison view: two coffins side by side, synchronised by spell.
