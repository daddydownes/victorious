# Safari scroll performance review — 27 September 2026

## Scope and source identity

Owner authorized repairs while preserving the look and feel. Baseline main is `bac0b908e9814487c4c7fa8d7f8f05c43cfaba1a`; the normalized original homepage SHA-256 is `d6a2886dd3e69e615504e8844f1d39287f46b4b48c7750407424e705cb6f7ad8`. Tested candidate homepage SHA-256: `e54e83d476b7d7aff2254044358e1a1d3afd26f9ce06845fb8c35375dde95157`.

Only the pre-Vault geometry reader in `tools/guided/journey.js` and inaccessible legacy-seam animation play state in `tools/guided/journey.css` change. `tools/build-guided.cjs` regenerates `index.html`. The hero, collection and signup markup, all assets, current visible CSS, Surface, game, transport, easing, transition durations, touch/wheel thresholds and entry-release rules remain unchanged.

## Findings and correction

1. Stable section rectangles were read repeatedly inside animation frames. Cache them and invalidate on actual layout changes. The no-ResizeObserver path still reads live geometry.
2. The old `.seam-gold[aria-hidden="true"]` kept animation clocks running, including `signalScan` changing `left`. Pause only that retired section and its pseudo-elements. Do not remove filters or effects from the visible design.

## Evidence already inspected

- Playwright 1.63.0, macOS WebKit: 20 A/B contexts (four original baselines plus four consecutive candidate passes at each of 390x844, 844x390, 1440x900 and 320x568), all passed. Narrow WebKit contexts use desktop wheel input, not physical iPhone swipes.
- Sixteen paired screenshots at collection, signup, overview and Vault are pixel-identical. CSS animation clocks are frozen and the randomized dust overlay is excluded only by the screenshot harness. Production dust and animations are unchanged.
- macOS WebKit collection-to-signup geometry reads fell from 222–230 per measured transition to zero; cached layout had already been measured before the gesture. No blanket FPS guarantee is inferred from runner measurements.
- `tests/entry-scroll-performance-unit.cjs`: 725 baseline-matched frame checks pass, including reversal, resize, short landscape and reduced motion. Candidate geometry reads are bounded at <=12 in the unit scenarios.
- Build, source-scope, guided scroll, reveal, press, Surface input/recovery, spatial layout and game lifecycle/physics guards pass.
- macOS WebKit controlled signup viewport and pointer recovery checks pass. Signup requests are mocked throughout.
- The original was exercised in native Safari 26.6.1 on macOS 15.7.9 using Apple WebDriver. This desktop run did not reproduce severe persistent stuttering; it is not a physical iPhone test.

Evidence: GitHub Actions run `36307496795`, macOS artifact `10927579202`; original native Safari run `36307077834`, artifact `10927976435`.

## Release verification

This branch contains the exact candidate, not an automatic publication. Final regression classification, native Safari candidate results and deployment verification are to be recorded before merging. Physical iPhone Safari, embedded browsers and the owner's original device are not certified by desktop or engine automation.
