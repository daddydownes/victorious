# Fullscreen Flappy V physics and lifecycle review

Reviewed September 6, 2026 against the working fullscreen candidate, including the final rounded IRIS lobes and shared sampled polygons. This is an extracted-code review, not a browser, physical-device or human playtest. The 12-flight witness suite was rerun after the final geometry change.

## Executed evidence

- `node tests/flappy-reachability.cjs`: 12 successful executable flights, using four deterministic seeds at each CSS size 375×667, 1440×900 and 667×375. Every replay used the actual rotated V/star collision and traversal handlers and cleared exactly 25 PILLAR, 25 ARCH, 25 SLANT and 25 IRIS obstacles. No replay bypassed a portal. Total: 1,200 clears.
- The search plans at 60 Hz against conservative bounds encompassing the rotated logo, including every actual aperture polygon breakpoint; actual replay advances at 120 Hz. Only the separate geometry-planning world overrides death/traversal. Replay uses the unchanged production handlers.
- Perturbing successful scripts: a 16.7 ms tap delay still reached 100 in all 12; a 50 ms delay ended at scores 25–66, median 40; omitting every 25th tap ended at 5–16, median 6. These are script sensitivity probes, not human win rates or proof of the intended subjective difficulty.
- `node tests/flappy-lifecycle.cjs`: 106 checks passed. Coverage includes four-tier pause/foreground/resume paths, eight locked/unlocked gate states through four resizes, 40 scheduler/focus cycles, reduced-motion opening, bounded gate/frame history, primary/repeated input, narrow-gap input/resize/resume and reward action behavior.
- `git diff --check` passed at the completion of those checks.

The witness search is bounded and sampled. It does not establish exhaustive route reachability, equivalent human difficulty on every display, rendering smoothness or physical touch latency.

## Geometry and fullscreen sizing

Logical height is 720; logical width follows the actual fullscreen aspect ratio. Logo height is 34 logical units and horizontal gate dimensions scale with logical width. Horizontal speed scales identically, retaining course timing. Vertical flight physics and gap sizes remain independent of aspect ratio. Resize preserves each gate's normalized horizontal position and all vertical geometry, resets presentation history and pauses an active flight.

Tier gaps decrease from 156–148 to 144–138, 132–126 and 116–104 logical units. IRIS neutral jaws are 48 units wider between opposing rounded lobes; each lobe reaches 24 units inward, preserving the authored minimum. The visible and collision surfaces share the same 29 sampled cross-sections. Polygon geometry is shared by painting and collision. Floating rails have genuinely open mouths and no invisible outer walls. Bypasses do not score; collision is evaluated before scoring/reward.

Compared with `5f098d6`, the original logo had a minimum 34 CSS-pixel height and the original gap was five logo heights. The candidate intentionally removes that landscape generosity: at CSS 667×375 the logo is approximately 17.7 CSS pixels tall; at 375×667 it is 31.5 pixels; at 1440×900 it is 42.5 pixels. Short-landscape visibility merits visual judgment. The exact V/star shape is preserved, but its CSS size is not identical to the original minimum-size behavior.

Gate movement settles at least 0.69 seconds before earliest contact under the capped future speed. Queued gate kinds are immutable. Future difficulty uses score plus unmissed pending gates, so bypasses cannot permanently advance difficulty or spawn cadence.

## Input and suspension review

The rAF loop retains its bounded watchdog. Gaps above 200 ms pause active play rather than integrating a large catch-up jump. Simulation accumulation is capped at 100 ms per advance, with 120 Hz steps. Background visibility and blur pause; foreground requires explicit resume. Pause clears accumulation; normal taps finish elapsed pre-input time using the previous velocity before assigning a flap. Cosmetic work runs once per presentation rather than per physics substep.

A resize/input ordering race was reproduced and fixed during this review. Previously, a size change discovered inside `flapTap()` could pause and still assign a flap impulse. The handler now checks again immediately after `flapSize()`, draws and returns before advancing or applying an impulse. Four added regressions cover this at every tier, changing dimensions immediately before input without pre-calling the size helper. Paused and explicitly resumed flights retain their previous position, score and velocity. These are included in the final 106 passing lifecycle checks.

## Rendering and allocation review

The original black/gold ambience systems are present: a baked far-dust strip, moving mid motes, additive near bokeh and bounded streaks. `flapEffects()` updates them and `flapDraw()` calls their sprite rendering. The candidate also has a baked architectural-light scene; restored systems should not be described as pixel-identical to the original artwork.

The foreground backing surface is capped at approximately six million pixels, including ordinary integer rounding. The baked scene is one ninth of its area. Far dust uses logical arena resolution, independently of DPR. Mid/near counts cap at 24/6 and streaks at eight. Gate pruning and eight-frame history are bounded by lifecycle fixtures.

Shared hazard construction allocates short polygon/point arrays. Collision first rejects horizontal non-overlap, so it constructs polygons only near the logo; rendering constructs polygons for visible obstacles and previews. This is bounded live work, but no allocation-rate or frame-time profiler was run. It would be inaccurate to claim zero per-frame allocation.

Metal materials use a 64-entry cache. Height, translation and phase are excluded from the key, avoiding rebuilds as gates deploy. This audit identified that count alone did not bound retained raster bytes. The renderer now also limits cached RGBA backing storage to 16 MiB and caps individual material width at 2,048 raster pixels. Eviction accounts for each canvas width × height × four bytes; clear resets both entries and byte accounting. The 16 MiB is a code-level backing-storage budget, not total browser/GPU memory. Main-canvas, scene, dust, transient canvases and compositor copies are separate. No browser memory profiler or demonstrated ordinary-display out-of-memory failure is claimed.

No release/deployment or browser-rendering claim is made by this review.
