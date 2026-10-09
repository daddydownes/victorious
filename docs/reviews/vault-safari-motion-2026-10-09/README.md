# Two-swipe Vault motion — October 9

Code commit: `6853483870def0aa80275bbdf4437c441d8b5619`.

Baseline: published main `d1820a1a985680924874fee55d57833978a1382d`, root SHA-256 `c3637f55406d4b3eb8a20bc26a827eccd222d96ede7cbd82cff2ccf6182c0520`. Candidate root SHA-256: `0281483d13bb237d403e5c6fa060c2b8b7fbff486a59f375bda7d38f8585f39b`.

The owner reports small glitches on both dates-to-overview arrival and overview-to-Vault zoom, using Safari on a newer iPhone. The exact model is unavailable. This follows the earlier photo-preparation and cancelled-entry fixes.

## Changes and scope

- Drive the camera with its continuous eased position rather than quantized native scroll readback. Replace the previous three-pixel completion snap with a sub-quarter-pixel finish. Fresh input can continue during the old completion tail; ongoing touch/wheel bursts still coalesce. Authored easing, duration formula, thresholds and separate overview landing remain.
- During an owned zoom or its reversal, keep the covered native scroller stationary and synchronize its endpoint once. Reverse from the displayed position. Native movement can take over either a running camera or deferred multitouch recovery. Delayed own-scroll events and genuine layout anchoring preserve accepted entry. Cancellation and idle native partial positions recover to overview without granting entry.
- Defer higher-resolution image requests, retries and visible source swaps during the camera and the existing 700ms handoff-settling period. Initial image loading remains available. In-flight upgrades release queue slots even when presentation waits. Cancellation and settlement flush pending work; the four-request limit and readiness fallback remain.
- Batch final chapter styles before native-pan measurement and focus. Skip visual-viewport-only measurement during camera ownership when layout dimensions are unchanged.
- Preserve all markup, CSS, filters, photo quality, media, camera geometry, archive pan, signup, Surface, game and hosting. No visual-cost reduction prototypes are included.

## Measured workload and limits

Three baseline and three final candidate runs use Chromium at 390×844, DPR3 and 6× CPU slowdown. The harness uses static opening setup, then normal motion, and explicitly warms/decodes all 33 displayed photos before measuring consecutive arrival and zoom. Signup is mocked. This isolates motion and handoff; it does not represent cold cellular delivery, completed-film QA or physical iPhone Safari.

| Measurement per run | Published baseline | Candidate |
| --- | --- | --- |
| Hidden signup-panel scroll updates during zoom | 26, 27, 26 | 1, 1, 1 |
| Slowest such scroll update, ms | 61.793, 63.475, 63.822 | 0.008, 0.008, 0.007 |
| Maximum moving arrival frame gap, ms | 17.6, 33.9, 17.6 | 18.5, 18.6, 18.7 |
| Maximum moving zoom frame gap, ms | 83.2, 65.8, 67.3 | 18.4, 31.5, 31.4 |
| Maximum zoom gap including handoff and 250ms after, ms | 83.2, 65.8, 67.3 | 33.9, 31.5, 31.4 |

The trace attributes the old long scroll work to repeated updates of `#nextDrop`; the final candidate performs one short endpoint update. Model tests separately verify 540 continuous frame positions across 60/120Hz and floating, one-third-pixel and integer scroll getters. The ordinary final step can no longer add the previous nearly-three-pixel kick.

These samples support removing specific work and discontinuities, **not a guarantee of 60 FPS or zero glitches on physical iPhones**. Browser/GPU scheduling varies: exploratory candidate runs also showed occasional longer gaps outside the eliminated scroll work. The final three samples are not a bound on future frames. Some final-handoff cost and photo rasterization remain; deferred resolution upgrades may appear after settlement. Summed trace durations may overlap and do not equal elapsed animation time.

[workload.json](workload.json) contains the compact baseline/final records. Reproduce with `tests/vault-motion-profile.cjs`, `BASE_URL`, `EVIDENCE_DIR`, `QA_LABEL`, `QA_PASSES` and optional `QA_SOURCE_SHA256`. Raw traces stay outside the repository. Moving-frame statistics intentionally exclude the first non-moving handoff sample; the separate whole-zoom maximum above includes it.

## Validation

Forty final-source browser journeys pass: four per configuration in Chromium 390×844/DPR3, 320×568/DPR2, 430×932/DPR3, 844×390/DPR2, 1280×720/DPR1 and 1440×900/DPR1; WebKit 390×844 and 844×390/DPR2; and Chromium reduced motion at 390×844/DPR3 and 1440×900/DPR1. This is 32 completed-original-film and eight reduced-motion journeys. Normal, reversal, repeated-input, cancellation/resize and reduced-motion focus paths pass with mocked signup and no page errors. First journeys additionally check Surface/game/return. Phone Chromium uses CDP touch; WebKit phone-size checks use wheel/keyboard in desktop mode, not iOS touch. See [journeys.json](journeys.json).

Final WebKit portrait/landscape overview and landed-Vault screenshots were inspected. The preserved photos, overview arrangement, landed scene and Surface control remain visible. PR #11 merged as `759ae09fa0cf412f6d5df1c07ebdf37e5d17a131`. GitHub Pages reported that commit built, and the canonical live homepage matched the tested root SHA-256 `0281483d13bb237d403e5c6fa060c2b8b7fbff486a59f375bda7d38f8585f39b`. A further live Chromium 390×844/DPR3 CDP-touch journey passed the completed hero, signup/focus, overview, Vault, Surface/game and return with mocked transport and no page errors. See [live.json](live.json).

`tests/vault-motion-continuity.cjs` passes 540 sampled frames plus held/fractional endpoint, fresh-tail input, coalescing, reversal, cancellation, multitouch, lifecycle, native takeover and layout-recovery regressions. All 27 existing `entry-scroll-settle-unit.cjs` cases pass. Expanded `vault-delivery-work.cjs` covers upgrade timing, queued/in-flight completion, starvation prevention, retry, cancellation, default/fallback focus, final handoff ordering, visual-only versus real viewport resize and decorative camera pause. `vault-motion-scope.cjs`, guided source/build and diff checks pass.

The required workflow regressions also pass on the final source: reveal/press, 120 scroll cases, Surface input/recovery and game difficulty/collision/material/lifecycle/death/reachability, including all 12 reachability courses and 1,200 obstacle clears. Historical exact-frame tests remain historical because their old completion tail is deliberately replaced; they were not weakened to pass this candidate.

Physical iPhone Safari, embedded browsers, Windows hardware and native macOS Safari have not been verified in this session. Browser-engine and viewport checks must not be described as those devices. The remaining acceptance check is the owner's physical Safari result on both swipes.
