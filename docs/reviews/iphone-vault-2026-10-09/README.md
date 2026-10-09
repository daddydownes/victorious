# iPhone Vault entry recovery

Code: `4450a04`; baseline: `4058137`. Candidate only, not deployed.

The production controller could finish its camera tween after `touchcancel`, multiple contacts or resize revoked entry permission. Blur/background cleanup could also snap to that inactive endpoint. Visitors saw the landed photo composition without an interactive archive. Eleven of the first fourteen new controller cases reproduced this on the baseline.

The fix completes accepted short swipes through normal toolbar height changes. Actual cancellation returns to the full overview; a later onward swipe enters normally. Unowned partial scroll positions recover to overview after idle without inventing entry intent. Existing overview-first navigation, reverse escape, release gate and reduced motion remain.

Two bounded performance changes prevent repeated decoding of an already displayed photo URL and suspend decorative dust drawing while the camera preview is active. Same-resolution derivatives, originals, upgrade/retry behavior and the four-request limit are preserved. No media, layout or visual CSS changed.

## Verification

The frozen homepage SHA-256 was `f896ab549553a2f121c1ea42264d98af1ae944e2c498467e58f2d240a630266d`. [Compact results](results.json) record the exact source, cases and engine limitations.

| Browser configuration | Consecutive journeys |
| --- | ---: |
| Chromium CDP touch, 320×568 | 4 |
| Chromium CDP touch, 390×844 | 4 |
| Chromium CDP touch, 430×932 | 4 |
| Chromium CDP touch, 844×390 | 4 |
| Chromium wheel/keyboard, 1440×900 | 4 |
| WebKit wheel/keyboard, 390×844 | 4 |
| WebKit wheel/keyboard, 844×390 | 4 |
| Chromium reduced motion, 390×844 | 4 |

These cover ordinary, reverse, repeated input, cancellation/rotation, form-focus continuation, exact-once handoff and Surface/game/return smoke. The 28 normal-motion journeys completed the original opening film; four used reduced motion. Signup transport was mocked, and passing journeys had no page errors. Portrait and landscape screenshots were inspected.

Ten additional browser cases cover toolbar resizing, rotation, blur, native partial scrolling, actual CDP touch cancellation and held-touch toolbar resizing. They use static-opening setup followed by normal motion. Twenty-seven deterministic controller cases include multitouch, lifecycle interruption, reduced-motion changes and recovery races. The retained ordinary entry geometry/easing comparison passes 725 states. Photo-delivery, four-job decode recovery, spatial layout, scope preservation, guided build/source/scroll, reveal, press, Surface input/recovery and all required Flappy geometry/material/lifecycle/death/reachability checks pass.

Preliminary harness failures were corrected: mobile WebKit cannot inject wheel events, a non-focusable panel did not receive WebKit navigation keys, awaited wheel acknowledgements could split a burst into fresh gestures, rapid portrait fixtures could touch the email field, and reduced motion has no in-flight tween to assert. The corrected fixtures preserve real input checks and add explicit inactive-endpoint assertions. One preliminary parallel large-phone run did not complete the hero; its cause was not established. A fresh four-pass large-phone run passed. The frozen production code did not change during these fixture corrections.

## Limits and reproduction

WebKit runs at phone dimensions in desktop mode; it is not physical iOS Safari. No physical iPhone, embedded browser, battery measurement or universal frame-rate certification was performed. Native macOS Safari session creation timed out and is not counted as a pass. The older `network-loading.cjs` harness also has a pre-existing missing `vaultCameraZoom` mock; the targeted delivery/decode tests exercise this change directly.

Build with `node tools/build-guided.cjs`. Run `tests/entry-scroll-settle-unit.cjs`, `tests/vault-delivery-work.cjs`, `tests/iphone-vault-scope.cjs` and the working-guide regression commands with Node. For Playwright, set `BASE_URL` to an explicit-root preview and `EVIDENCE_DIR` outside the checkout; run `tests/entry-scroll-settle-browser.cjs` and `tests/entry-scroll-browser.cjs`, selecting `QA_CASE` and four `QA_PASSES`. `QA_SOURCE_SHA256` enforces the tested page. Publication requires a separate main/Pages/live verification.
