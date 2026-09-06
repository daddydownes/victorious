# Flappy V fullscreen geometry review

Review date: 2026-09-06. This record covers the fullscreen candidate developed after `44401b5`; it does not assert that the candidate was published. See `docs/STATUS.md` for the release state. Review performed through production-source inspection and Node fixtures, without browser driving.

## Result

The game fills the viewport again using a logical height of 720 and a width of `720 × CSS aspect ratio`. Horizontal speed and obstacle width scale with logical width, preserving nominal passage duration across aspect ratios. The V/star keeps its original filled SVG geometry and tap/gravity model.

Distinct obstacle topology progresses with successfully cleared passages:

| Points | Newly encountered geometry | Retained challenges |
| --- | --- | --- |
| 0–24 | Full-height pillars with a clear opening | Introductory speed ramp |
| 25–49 | Floating open arches, deployed from above/below | Increasing pace |
| 50–74 | Slanted open tunnels | Deployment and vertical approach movement |
| 75–99 | Solid jaws, with two rounded inward lobes per rail | Deployment, diagonal passage, compression and longer crossing |

The final jaw has 29 inner vertices per rail sampling two cosine-shaped, blunt inward lobes. Its neutral opening is 48 logical pixels wider than the authored gap; two 24px lobes on each side return the narrowest points to the authored minimum, 104px. The outer back is a straight, slanted plate rather than a copy of the inner wave. This follows the user’s later smooth-shape direction and supersedes the earlier angular fang proposal. Timing and the minimum opening are unchanged.

## Geometry and scoring contracts

`flapHazardPolygons` supplies both collision geometry and the rendered obstacle polygons. `flapDraw` passes the interpolated pose into that helper, and `flapDrawMetal` clips all material, bevel and highlight painting to those polygons. Dashed deployment previews intentionally depict the forthcoming final geometry; they are not solid collision surfaces.

`flapAperture` and the polygon cross-sections have identical piecewise-linear boundaries. The final jaw samples include both lobe centres, .34 and .66, with half-width .13. The mouth flare also uses a rounded profile. `flapAperture.irisProfile` provides the identical samples to the polygon helper; aperture queries linearly interpolate those samples instead of evaluating an unmatched smooth curve. Interpolation was checked between vertices, not only at vertices.

Collision tests use the actual filled V and separate star contours, including rotation and the empty centre of the V. Tangency is a hit. A .02 logical-pixel separation at a broad flat edge is safe. Curve flattening has a bound of approximately .04753 logical pixels.

Floating obstacles do not create invisible walls extending to the screen edges. Traversal must enter the mouth, remain within the channel and fully clear the trailing face to score once. Bypassing above or below is safe and earns no points. Actual rail collision runs before the scoring check. The normal floor remains lethal.

A queued obstacle receives an immutable type based on earned score plus pending, unmissed passages. Skipped passages do not permanently advance the stage; already visible obstacles do not mutate when the score changes. This queue anticipates successful clears, so a future-stage object may be visible ahead before the current score reaches its boundary.

## Checks run

- `node tests/flappy-difficulty.cjs`: passed after the rounded-jaw change. 12,500 gates, 100 seeded courses using 20 seeds across five sizes, and 65 successful/bypassed traversal fixtures. Minimum sampled settled warning: .6917205 seconds; minimum authored gap minus the conservative logo diameter: 66.2760 logical pixels. Also checked score boundaries, reward persistence, resize pausing, responsive passage duration, cosmetic RNG isolation and equivalent 30–144Hz fixed-step trajectories.
- `node tests/flappy-collision.cjs`: passed on the final inspected candidate. 242 grouped checks, 64 finite-rail poses and 16,016 aperture interpolation samples. Covers visible hits, empty passage, exterior bypass space, pose translation and lobe minima.
- `node tests/flappy-material.cjs`: passed on the final inspected candidate. Checks clip-before-paint discipline, angled passage edge selection, material reuse and the 64-entry cache bound.
- Source comparison against `44401b5` confirmed unchanged metadata/head entries, unchanged opening V/star SVG path and unchanged pointer/keyboard handler block.
- `git diff --check` passed for the affected source and test files after the geometry change.

The difficulty fixture uses zero-time aperture-following samples for its traversal cases. Those are collision/scoring checks, not claims that a human or physics-driven controller can follow the route. Separate executable witness coverage belongs to `tests/flappy-reachability.cjs` and its release record.

## Allocation review

The main canvas limits its backing store to approximately six million pixels, with native DPR capped at 2 before the area limit. Background sprite storage rebuilds on metric changes and replaces its prior reference. The main baked scene is one-third of each logical dimension; motes, bokeh and streak sprites are small. Background particle counts are capped at 120 far dots, 24 motes, 6 bokeh particles and 8 active streaks.

Metal materials use a 192-unit-high tile. Translation, obstacle height and animation phase do not generate new cache keys. Eviction keeps at most 64 entries. The final material update also adds a 16 MiB cache-byte ceiling and 2048px raster-width cap. This is not a total browser/GPU memory guarantee: the main canvas limit does not include every offscreen canvas; far dust uses logical dimensions, and material detail has a minimum scale of 1. Extremely wide, nearly zero-height viewports are not bounded by a separate offscreen-pixel budget. GPU memory pressure and browser canvas limits were not measured in this review.

## Remaining limits

No physical-device, browser rendering, accessibility-tree or subjective visual-quality claims come from this review. Shared geometry and clipping establish consistency in the source; actual rasterization and input latency still require browser/device checks. Seeded checks are not exhaustive reachability or a measure of human completion rate. Existing storage keys and reward code remain client-side, browser-local state.
