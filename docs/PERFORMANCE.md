# Performance: before and after

All numbers are measured, except GPU texture memory, which is computed from texture dimensions. Raw data is in [`docs/metrics/`](metrics/). "Before" is the Phase 1 build (`47a8849`), which kept the original asset pipeline.

**Environment:** headless Chromium on a 2-vCPU server with WebGL emulated on the CPU (SwiftShader), localhost, cache disabled. Download sizes and decode times transfer to real devices. Timings involving the GPU do not: here every draw call and texture upload runs on the CPU. Physical phones and GPU desktops have not been measured yet; see "Next measurements".

## Download per exhibit

Includes HTML, JavaScript, fonts and all model files at the given quality.

| Object          |  Before | Standard (2048) | Full resolution (4096) | Preview shown first |
| --------------- | ------: | --------------: | ---------------------: | ------------------: |
| Psamtik-Seneb   | 20.2 MB |          6.1 MB |                18.7 MB |             1.80 MB |
| Irethoriru      | 15.4 MB |          4.2 MB |                13.5 MB |             1.37 MB |
| Iwefaa          | 14.2 MB |          3.3 MB |                11.8 MB |             0.67 MB |
| Anonymous woman |  4.8 MB |          1.9 MB |                 3.1 MB |             0.83 MB |
| Amenirdis       |  8.6 MB |          2.3 MB |                 7.5 MB |             0.88 MB |
| Psamtik         | 19.0 MB |          3.6 MB |                16.5 MB |             0.72 MB |

The preview column (geometry plus 1024 px textures) is what must arrive before the object appears; it is read from the asset manifest. Standard quality is what phones, tablets and most laptops receive automatically. Full resolution serves the original photographs and is chosen automatically only on capable desktops.

## Geometry

Download size from the manifest; parse/decode time is the median of 7 runs in Node.js on the same machine, three.js `OBJLoader.parse` versus `GLTFLoader.parseAsync` with the meshopt decoder.

| Object          | OBJ (before) | GLB (after) | OBJ parse | GLB decode |
| --------------- | -----------: | ----------: | --------: | ---------: |
| Psamtik-Seneb   |      3.26 MB |     1.04 MB |     94 ms |     2.8 ms |
| Irethoriru      |      3.20 MB |     1.04 MB |     93 ms |     2.9 ms |
| Iwefaa          |      2.98 MB |     0.38 MB |    132 ms |     1.8 ms |
| Anonymous woman |      2.41 MB |     0.77 MB |     82 ms |     2.4 ms |
| Amenirdis       |      1.91 MB |     0.69 MB |     81 ms |     3.2 ms |
| Psamtik         |      3.13 MB |     0.44 MB |    116 ms |     1.9 ms |

## Estimated GPU texture memory

RGBA8 with a full mip chain (width × height × 4 bytes × 4/3). Before, every device received all textures at 4096 px.

| Object          | Before (all 4096) | Standard |   Low |
| --------------- | ----------------: | -------: | ----: |
| Psamtik-Seneb   |            341 MB |    85 MB | 21 MB |
| Irethoriru      |            341 MB |    85 MB | 21 MB |
| Iwefaa          |            341 MB |    85 MB | 21 MB |
| Anonymous woman |             85 MB |    21 MB |  5 MB |
| Amenirdis       |            341 MB |    85 MB | 21 MB |
| Psamtik         |            341 MB |    85 MB | 21 MB |

## Time to first frame

Milliseconds from navigation start to the first frame in which the model is drawn (a `data-first-frame` marker on the canvas, added identically to both builds for this measurement). Median of 3 interleaved runs.

| Object          | Before: first frame | After: first frame | After: standard textures shown | After: full resolution shown |
| --------------- | ------------------: | -----------------: | -----------------------------: | ---------------------------: |
| Psamtik-Seneb   |               4.2 s |              1.5 s |                          2.9 s |                       13.0 s |
| Irethoriru      |               4.2 s |              1.8 s |                          2.4 s |                       12.4 s |
| Iwefaa          |               3.8 s |              1.1 s |                          7.8 s |                       11.3 s |
| Anonymous woman |               1.8 s |              1.2 s |                          7.3 s |                        7.5 s |
| Amenirdis       |               3.6 s |              0.9 s |                          7.6 s |                       11.2 s |
| Psamtik         |               4.2 s |              1.5 s |                          2.0 s |                       13.0 s |

- **First frame:** 1.5–3.9× sooner in every exhibit. The object now appears as soon as compressed geometry and 1024 px textures arrive, and the page preloads those files while the viewer's JavaScript is still loading.
- **Standard textures:** within 3 s on three of six objects. On the others, the final texture upload stalls in this CPU-emulated renderer (see below).
- **Full resolution is slower to reach here (7.5–13.0 s against 1.8–4.2 s).** Profiling shows the time is in `texSubImage2D`, the WebGL texture upload. The first 4096 px upload after the preview takes 8–9 s in SwiftShader; later uploads take about 0.85 s each. The same four uploads take about 2.5 s in the old build. Ruled out by experiment: image source (`ImageBitmap` and `<img>`), flip orientation, colour-space conversion, anisotropic filtering, shadow maps, the environment map, and repeated uploads (each texture is uploaded exactly once). The cause is not identified, and whether it occurs on GPU hardware is unmeasured. To limit the effect, uploads are staged one per frame before the swap, and the model stays visible and readable throughout.

## Pages and JavaScript

| Route           | Before: transfer | Before: JS | After: transfer | After: JS |
| --------------- | ---------------: | ---------: | --------------: | --------: |
| `/`             |           581 KB |     193 KB |          457 KB |    149 KB |
| `/research`     |           363 KB |     193 KB |          239 KB |    149 KB |
| `/exhibits/*`   |                — |     450 KB |               — |    447 KB |
| `/search` (new) |                — |          — |          356 KB |    156 KB |

Tailwind, shadcn, Geist and Motion were removed; the exhibit bundle is roughly unchanged because it is dominated by three.js and React Three Fiber.

## Rendering work

- Region outlines are batched by state into at most four draw calls instead of one per region (up to 265 on Irethoriru). An end-to-end test asserts fewer than 40 draw calls per frame, shadow passes included, with all 265 regions outlined.
- Hover picking projects region polygons without raycasting the mesh on every pointer move.
- Rendering is on demand; nothing is drawn while the scene is still.
- GPU resources are disposed when leaving an exhibit, and in-flight downloads are aborted.

## Next measurements

1. iPhone (Safari) and a mid-range Android phone: first frame, standard tier, memory, frame time while orbiting.
2. A GPU desktop: full-resolution upload time, to confirm whether the software-renderer stall exists on hardware.
3. Set budgets from those numbers (for example: first frame under 1.5 s on a mid-range phone on 4G) and enforce them in CI.
