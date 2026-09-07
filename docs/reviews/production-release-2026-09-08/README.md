# Production release evidence — September 8, 2026

The parent report is [`../production-release-2026-09-08.md`](../production-release-2026-09-08.md). These files preserve selected pre-publication and live-after evidence for release `b234910759464b5fed809e35d36909f46977afe5`, built from source commit `a05c186bc55f76a83f9f17c9593c712392503348`.

## Root and mobile

`mobile/final-results.json` records four consecutive WebKit journeys at 390×844 and four at 844×390. `mobile/pinch-results.json` records the Chromium reduced-motion pinch check. `mobile/live-before-540x360.png` is the deployed `46226be` failure, where no entrance pixels are visible; `mobile/local-after-540x360.png` is the corrected candidate. The film-loop screenshots are representative points in the final natural journeys.

`tests/release-regressions.json` records the eight focused root/story checks. The selected screenshots cover the 480×320 and WebKit 540×360 invitation, the mocked successful receipt, and the readable title while its artwork is pending.

`mobile/live-after-results.json` and `mobile/live-after-pinch-results.json` record the focused canonical-domain verification. The accompanying report and selected screenshots cover the corrected 540×360 invitation/Vault entry and reduced-motion focus path.

## Desktop navigation

`navigation/results.json` records four consecutive complete Chromium journeys across 1280×720 and 1440×900, normal and reduced motion. The run is labeled `3396ea7`; the production root/story bytes in that run are identical to `8058f9b`, whose only intervening changes were two test lines. The later `a05c186` changes only the story film status label exercised separately under `runtime/`.

## Runtime

`runtime/film-status-results.json` records the final local story film-state checks after the `a05c186` label change. `runtime/live-after-results.json`, its report and selected pending/final/reduced screenshots record the focused canonical-domain story and game verification. The checks use browser engines and an emulated delayed response; they are not physical-device or carrier measurements.

## Evidence limits

All screenshots and journey results were collected with local loopback browser automation. Signup transport was mocked, and no live form was submitted. Viewport, touch, pinch and accessibility-tree checks are browser emulation, not physical-device, physical multi-touch or assistive-technology certification. Seeded Flappy screenshots and deterministic witnesses are test fixtures rather than human playthroughs.
