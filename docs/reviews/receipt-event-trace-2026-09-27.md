# Landscape touch-target investigation — 27 September 2026

## Correction to the initial diagnosis

An early diagnostic described a possible non-editable receipt-area swipe dead zone. Event-level evidence does not support that diagnosis. The sampled coordinates passed to Chromium's CDP touch emulation were `(422, 62.4)` at a viewport of 844×390. Before dispatch, `document.elementFromPoint()` returned `#nextDropResult`. However, the browser delivered both the actual `pointerdown` and `touchstart` to `#nextDropEmailInput`, and subsequent `touchmove` events retained that input target. The guided controller intentionally excludes editable targets.

Run `36309040204` on diagnostic commit `63fb708f040cdfa95c5233e91c2c49829f881213` records 272 event snapshots. All five attempted reverse gestures in the failing sequence were delivered to the email input, not the receipt. The `receipt-input-trace` artifact's `entry-scroll.json` includes the event target, composed path, computed touch-action, focus, panel classes and controller state. The failed assertion expected chapter navigation from those editing gestures; it is not evidence that a true receipt-targeted gesture was swallowed.

The same coordinate sequence failed on the original September 24 source. Moving the test gesture well clear of the form allowed four consecutive landscape journeys on that original source. Avoid using pre-dispatch DOM hit-testing alone to certify the eventual touch-event target.

## Application decision

A trial change restricting the form's pointerdown guard to actual controls did not resolve this diagnostic failure, because the actual target was already an input. That trial is not part of the published repair. Do not merge it merely to make this test pass or weaken editing protections.

The published runtime remains the independently verified geometry-cache and covered-animation repair at commit `965985284f3f750dd5f27b873872fad30ac8f2ec`, homepage SHA-256 `bfef4d4b086834c074274d12bc2e97d93004b99c619ac2dc2c6e13c1e04ce67e`. Its canonical-source equality, completed-hero phone journey, Surface/game/return checks and 725 baseline-matched deterministic controller frames were independently re-read from run `36308304555`. This note changes no runtime file.

See [canonical release verification](canonical-safari-smoke-2026-09-27-0907.md) and [implementation review](safari-scroll-2026-09-27.md). Alternate hashes and their test counts must not be substituted for this published revision's evidence. Physical iPhone Safari and real trackpad momentum remain outside the executed checks.

Trace run: https://github.com/daddydownes/victorious/actions/runs/36309040204
Canonical verification: https://github.com/daddydownes/victorious/actions/runs/36308304555
