# Safari scroll performance review — 27 September 2026

## Scope and source identity

Owner authorized repairs while preserving the look and feel. Baseline main is `bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a`; normalized original homepage SHA-256 is `d6a2886dd3e69e615504e8844f1d39287f46b4b48c7750407424e705cb6f7ad8`. Tested candidate homepage SHA-256: `e54e83d476b7d7aff2254044358e1a1d3afd26f9ce06845fb8c35375dde95157`.

Only the pre-Vault geometry reader in `tools/guided/journey.js` and inaccessible legacy-seam animation play state in `tools/guided/journey.css` change. `tools/build-guided.cjs` regenerates `index.html`. The hero, collection and signup markup, all assets, current visible CSS, Surface, game, transport, easing, transition durations, touch/wheel thresholds and entry-release rules remain unchanged. Diagnostic workflows and temporary CSS ablations are not part of the release.

## Findings and correction

1. Stable section rectangles were read repeatedly inside animation frames. Cache them and invalidate on actual layout changes. ResizeObserver, resize, font readiness, visibility return, motion changes and panel exposure invalidate the cache. The no-ResizeObserver path still reads live geometry.
2. The old `.seam-gold[aria-hidden="true"]` kept animation clocks running, including `signalScan` changing `left`. Pause only that retired section and its pseudo-elements. No filter or effect is removed from the visible design.

These are confirmed sources of unnecessary work, not proof that every device-specific Safari stutter has been eliminated. Original native Safari measurements did not reproduce severe persistent stuttering; cold image loading and hardware-dependent paint costs remain possible contributors.

## Inspected evidence

### Appearance and scrolling

- Playwright 1.63.0 on macOS WebKit: 20 A/B contexts (four original baselines plus four consecutive candidate passes at each of 390x844, 844x390, 1440x900 and 320x568), all passed. Narrow WebKit contexts use desktop wheel input, not physical iPhone swipes.
- All 16 paired collection, signup, overview and Vault screenshots are pixel-identical. CSS clocks are frozen and randomized dust is excluded only by the screenshot harness; neither change is in production.
- macOS WebKit collection-to-signup rectangle reads fell from 222–230 per measured transition to zero. Cached geometry was already measured before the gesture. The overview-to-Vault transition fell from 167–181 reads to 4–6. No uniform FPS improvement is claimed from runner measurements.
- `tests/entry-scroll-performance-unit.cjs` passes 725 baseline-matched animation-frame checks, including reversal, resize, short landscape and reduced motion. Candidate geometry reads are bounded at <=12 in those unit scenarios.
- Build, source-scope, guided scroll, reveal, press, Surface input/recovery, spatial layout and game lifecycle/physics checks pass.

### Native Safari and full journeys

- Native Safari 26.6.1 on macOS 15.7.9 was exercised through Apple WebDriver, without an iOS simulator. Both original and candidate post-opening collection → signup → overview → Vault paths passed. Candidate HTML SHA matches the tested release exactly. Its native run used a static opening (recorded hero time zero); do not call it completed-hero playback coverage.
- Chromium full-original-hero journeys passed four consecutive times each at 390x844, 320x568 and 1440x900. The desktop reduced-motion case also passed four times. The first pass in each case checks Surface, game and return.
- At 844x390, the existing navigation test began its reverse swipe on an editable input, which intentionally belongs to native form interaction. The same assertion failed on untouched production. Moving the test-only gesture to a noneditable gutter made the baseline pass and the exact candidate pass all four normal/reverse/spam/cancel-resize journeys. Production gesture handling was not modified.
- macOS WebKit and Chromium controlled signup viewport and pointer recovery checks pass. Form transport is mocked; no real signup is submitted.

### Retained test limitations, not hidden passes

- Linux WebKit's 80ms keyboard-fit assertion and normal-opening wait failed identically on untouched production and candidate. Waiting for animation frames resolved the fit assertion on the baseline, but its screenshot font wait and opening wait still timed out. This environment does not establish a passing Linux keyboard matrix. macOS WebKit passed that matrix.
- The existing reduced-motion phone spam test sends two separately released gestures but expects one landing. The baseline and candidate both move two immediate landings. Baseline reproduction also confirms the equivalent approach assertion. Normal and reverse reduced-motion phone passes succeeded; a complete four-pattern reduced-motion phone pass is not claimed. No debounce or timing change was made to alter this existing behaviour.
- Physical iPhone Safari, embedded browsers and the owner's original device remain untested. Engine viewport tests are not physical-device certification.

## Evidence references and release verification

- macOS WebKit comparison: run `36307496795`, artifact `10927579202` (`comparison.json`, screenshots and source patch).
- Original native Safari: run `36307077834`, artifact `10927976435`.
- Exact candidate native Safari: run `36307801089`, artifact `10927403187` (`candidate-sha256.txt`, `native-safari.json`).
- Broader Chromium/keyboard checks: run `36307535186`; failed cases are classified above, not reported as an all-green workflow.
- Baseline regression classification: run `36308001339`, artifacts `10927779073` (landscape), `10927594564` (reduced motion), `10928142306` (Linux keyboard).

The release is limited to the verified source correction, its unit regression test and documentation. Publication is checked separately against the canonical live homepage and the candidate SHA-256; the release pull request records the final deployment result. No force-push, asset replacement or temporary diagnostic workflow is included in the production changes.
