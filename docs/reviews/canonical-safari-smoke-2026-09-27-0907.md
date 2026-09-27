# Canonical Safari repair verification — 27 September 2026

## Published revision and live check

The canonical homepage returned HTTP 200 and matched the normalized `index.html` of published commit `965985284f3f750dd5f27b873872fad30ac8f2ec` exactly.

- Homepage SHA-256: `bfef4d4b086834c074274d12bc2e97d93004b99c619ac2dc2c6e13c1e04ce67e`.
- GitHub Pages deployment: run `36308106782`, completed successfully at 09:03:27 UTC.
- Independent canonical verification: run `36308304555`, completed successfully at 09:07:30 UTC. Its `canonical-safari-repair-verification` artifact contains `live-source.json`, the actual live journey, screenshots and unit/scope results.
- The live 390×844 Chromium/CDP-touch journey completed the original hero, signup navigation/focus checks, photographic overview, Vault, Surface, game and return, with no page errors. Signup transport was mocked; no live signup was submitted.
- The published controller passed 725 exact baseline-matched frame states. Geometry reads in its five deterministic scenarios fell from 600/600/706/580/524 to 6/6/3/9/6. This measures code work, not overall frame-rate improvement.

## What was fixed without a redesign

The published guided controller reuses stable section geometry instead of repeatedly measuring it while scrolling, with invalidation for relevant layout/font/lifecycle changes. Covered legacy and hero CSS animations are paused once those chapters retire. Existing visible artwork, media, layout, blur/glow definitions, gesture thresholds, easing, transition durations, Vault interaction, Surface and game remain unchanged. See `safari-scroll-2026-09-27.md` for the implementation review.

The exact published candidate was covered by run `36307336988`: native Safari 26.6.1 on macOS 15.7.9 through Apple WebDriver, Chromium/WebKit baseline comparisons and completed-hero Chromium journeys. The downloaded engine evidence identifies this exact homepage hash. In sampled Chromium measurements, collection-to-signup rectangle reads fell from 238 to 0 after cache initialization, while collection-idle layout events fell from 36–37 to 0. Native Safari signup and Vault comparison screenshots were pixel-identical; this is not a guarantee of every live animation frame.

## Separate candidate evidence — do not conflate hashes

A parallel, narrower animation-pause/cache-fallback candidate has homepage hash `e54e83d476b7d7aff2254044358e1a1d3afd26f9ce06845fb8c35375dde95157` on `fix/safari-scroll-preserved-20260927`. That candidate passed 16 normal-motion macOS WebKit journeys and 16 pixel-identical frozen-animation screenshot pairs, plus focused four-pass landscape and reduced-motion Chromium follow-ups in run `36308029767`. It was not substituted for the already-published revision. Those specific counts must not be represented as tests of the different published hash.

The landscape test initially started reverse swipes inside the email input on both original and candidate pages. Hit-testing a non-editable start point corrected the test without changing the intentionally protected editing gesture. A controlled macOS WebKit fallback-keyboard fixture also failed identically on original and alternate candidate (`fallback input above panel`); this remains a limitation, not a passing test.

## Remaining limits

Some photo-overview entry frame gaps remain in the measured environments. These changes remove confirmed overhead, but do not establish that every reported Safari hitch is eliminated. Native macOS Safari and phone-sized engine automation are not physical iPhone Safari tests. Real trackpad momentum, iPhone low-power/thermal conditions and embedded browsers still need device feedback. No media quality reduction or visible-effect removal was used to conceal these remaining gaps.
