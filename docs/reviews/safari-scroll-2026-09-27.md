# Safari scroll performance repair - 27 September 2026

## Scope and diagnosis
Baseline: `bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a`. Root candidate SHA-256: `bfef4d4b086834c074274d12bc2e97d93004b99c619ac2dc2c6e13c1e04ce67e`.
The initial guided scroll repeatedly measured stable section positions while updating scroll/style. The covered legacy seam also retained running CSS keyframes. These are avoidable overhead, not proof of the sole cause of every Safari stall.
`tools/guided/journey.js` now caches grouped geometry until layout, font, resize or lifecycle changes invalidate it. `tools/guided/journey.css` parks covered legacy/hero CSS animations after those chapters are retired. `tools/build-guided.cjs` regenerated the root.
Existing visible artwork, media bytes, blur/glow definitions, layout, gesture thresholds, easing, duration, stop sequence, signup transport, archive pan, Surface and game are unchanged. No blanket filter removal, reduced quality or scroll-physics retuning was shipped.

## Verification
Independent successful Actions run: https://github.com/daddydownes/victorious/actions/runs/36307336988 at input commit `fefc2e628571e67b2482fc9c392373e0fb6050fb`. The release reproduces its exact root hash.
- Actual Safari 26.6.1 (20624.5.1.18.3), macOS 15.7.9 hosted runner, Apple WebDriver with no simulator: original and candidate collection/signup/overview/Vault journeys passed with click and keyboard input. These are not physical iPhone tests.
- The sampled native Safari signup and Vault screenshots compare pixel-for-pixel equal. The collection sample has small image-region differences and is not claimed pixel-identical. This does not establish equality of every animation frame.
- Playwright 1.63.0 Chromium and WebKit: original and candidate wheel journeys passed at 390x844 and 1440x900, after static-opening setup then normal motion. Narrow WebKit uses desktop-engine wheel input, not real iPhone gestures.
- Eight completed-hero Chromium journeys passed: four at 390x844 with CDP touch and four at 1440x900 with wheel/keyboard. Normal, reversal, spam and cancel/resize paths were covered; first pass of each size included Surface, game and return. Form transport was mocked.
- `tests/entry-scroll-performance-unit.cjs`: 725 exact baseline-matched controller states across five scenarios, with more than 80% fewer geometry reads in each scenario. This is a unit-level work reduction, not an 80% FPS improvement.
- Build, scope, guided-source/scroll, reveal, post-Surface, press-feedback, Surface input/recovery, spatial layout and six game regression checks passed.
- Clean-release checks also exercised covered-animation suspension at collection, signup, overview and Vault in normal/reduced-motion Chromium and WebKit without disabling animations for screenshots.

## Measurements and limits
In the sampled Chromium collection-to-signup transition, DOM rectangle reads fell from 238 to 0 after the geometry cache was populated. Initial collection idle layout events fell from 36-37 to 0 in the sampled interval. Do not extrapolate this to overall FPS.
The performance harness used screenshots with `animations: disabled`, which subsequently showed resumed legacy animation objects; later timing samples are not a clean measurement of suspension. The clean-release check therefore verifies computed animation state without that screenshot intervention.
Linux WebKit retained substantial photo-overview frame gaps; actual Safari also had occasional photo-entry gaps. The repair removes verified overhead but does not certify that the owner's reported lag is fully resolved. Physical iPhone Safari, real trackpad momentum, thermal/low-power conditions and embedded browsers still require device feedback. No live signup was sent.

## Deployment
This report accompanies a verified release candidate assembled from the unchanged production baseline. Publication is a separate fast-forward after source review; confirm Pages and the canonical live hash in the release task. Diagnostic workflows and one-time patch scripts are excluded from the final release tree.
