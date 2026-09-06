# Flappy V redesign candidate — September 6, 2026

This is a reviewable candidate on `demo/flappy-v-redesign`, not a production release. The core remains the original V-and-star logo flying through gaps with tap/click/Space input. Live main remains the previous site. `033db26` preserves the first difficulty prototype; results for that version are not evidence for the later silhouette collision.

## What changed

A fixed 420×720 course removes the old aspect-ratio difficulty advantage. Four cumulative sections introduce pins after 25 clears, shifting openings after 50 and narrow, wide squeezing locks after 75. Final openings reduce to 104 logical pixels while poles reach 82 wide. Patterned routes, smooth speed changes and eased deployment replace unrelated jumps. Geometry settles at least approximately 0.69 seconds before the earliest possible logo contact in the tested courses.

The poles have shaded front/right faces and clipped gold bevels. Collision uses the same SVG that draws the rotating V and star, preserving the V's empty centre. Separate pole polygons follow the 14px cap and 6px bevel, including partial reveal. Curve approximation is below 0.048 logical pixels; antialiasing and discrete 120 Hz sampling mean this is not literal continuous pixel-perfect physics. Floor contact and scoring use the silhouette too.

Removed words travelling through the playfield, floating +1 text, bokeh/streak clutter and scene flashes. Native score, stage labels and four-part progress sit outside the course. Original logo, flap impulse, gravity, saved best/reward keys, pause behavior and reduced-motion poster remain. Retry from the visible reward button now works immediately; the canvas keeps its accidental-tap guard.

## Sequential agent review record

| Pass | Bounded responsibility | Outcome |
| --- | --- | --- |
|1|Prototype design/physics audit|Found the old75-point breathing challenge widened gaps and made the final section easier.|
|2|Prototype geometry tests|Added deterministic gate, boundary, cadence and reward fixtures.|
|3|Prototype route reachability|Added executable full-flight search/replay, with explicit human-difficulty limits.|
|4|Lifecycle audit|Found reward button's initial600 ms dead period; fixed explicit action while retaining canvas guard.|
|5|Full redesign direction after user expanded scope|Specified fixed arena, cumulative course, clearer UI and calmer motion; preserved core Flappy identity.|
|6|Physics implementation|Implemented fixed arena, route phrases, tier dimensions and eased hazard motion.|
|7|Redesign proof before precise silhouette request|Updated geometry/reachability tests; identified need to distinguish physics solvability from input sensitivity.|
|8|Precise collision implementation after user requested 3D poles/accurate hits|Derived cached V/star contours and beveled pole collision; dedicated shape checks.|
|9|Final silhouette proof|Updated all fixtures to real SVG, verified 36 full paths with actual collision and 102 lifecycle cases.|
|10|Independent visual/code audit|See [final audit](flappy-final-audit-2026-09-06.md) for findings and browser scope.|
|11|Unmodified full-site integration attempt|[Interrupted by active browser interaction](flappy-integration-2026-09-06.md); zero clean journeys counted. No application bug established.|

The parent implemented UI/rendering, matched pole bevel art, isolated course randomness from cosmetic frame activity, corrected warning distance for the full rotating logo, integrated review fixes and maintained the portable handoff.

## Automated evidence for the silhouette version

[Machine-readable evidence](flappy-redesign-evidence-2026-09-06.json) records the detailed outputs.

- `tests/flappy-difficulty.cjs`: 12,500 gates (20 unique seeds repeated across five CSS sizes), plus DPR invariance, stage thresholds, collision tangency/separation, reward, resize and 30–144Hz rotation/physics cadence checks. Minimum stationary warning 0.691684685s. Minimum gap 104; full circumscribed-logo clearance 66.276px.
- `tests/flappy-collision.cjs`: 50 dedicated checks against the actual SVG, including body/star, rotations, concavity, contact/separation and beveled corners. Two contours with 33 and 79 vertices; flattening bound 0.047526px.
- `tests/flappy-lifecycle.cjs`: 102 fixtures, including 40 repeated scheduler cleanup/focus cycles, all-tier pause/background/stall handling, resize, reduced-motion opening, and 8 narrow-gap pointer/keyboard/resize/resume survival cases.
- `tests/flappy-reachability.cjs`: 36 seeded courses, 3,600 gate clears. A bounded search found conservative rotation-invariant paths, then replayed them through actual silhouette collision and production spawn/score timing.
- Reveal, invitation press, post-Surface scrolling and Surface input regression suites pass; embedded script parses and `git diff --check` passes.

Search uses future course knowledge and is a solvability witness for sampled seeds, not proof of every possible course or human difficulty. Perturbing those successful input scripts by 16.7ms produced median 79 clears; 50ms produced median 31. Missing every 25th tap produced median 6. Those values measure sensitivity of artificial scripts, not human win rates.

## Browser and release limits

Parent inspected desktop Safari's redesigned idle, stage progress, pause and visible V flight. Chrome successfully showed the earlier prototype, then returned empty native automation views and unavailable screenshots during phone-emulation setup. That earlier Chrome result does not verify the redesigned game. Pass10 records the final independent Safari checks separately. Pass11 attempted the unmodified journey but stopped after active browser interaction blocked testing; no clean journey was counted. No current physical-phone, Windows Chrome, phone Safari or full production journey matrix is claimed.

This candidate needs player feedback on difficulty/size and remaining browser/device release checks before an authorized publication. No live signup requests or production reward changes were made. Local preview uses separate storage keys and introduces no stage shortcuts into the production index.

## Reproduce

Run `python3 tools/flappy-demo.py` and open `http://127.0.0.1:8938/demo`. Stage buttons jump to 0/25/50/75. Pole detail is a paused art study using the current renderer, not a gameplay test. The server's `/` route serves the unmodified candidate for journey testing. Run the four `tests/flappy-*.cjs` files with Node, plus the existing regression commands in `docs/WORKFLOW.md`.
