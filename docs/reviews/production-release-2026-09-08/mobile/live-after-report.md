# Live-after mobile verification

Published release: `b234910759464b5fed809e35d36909f46977afe5`

URL: `https://vctrsclo.com/`
Checked: 2026-09-08 Australia/Sydney

## Result

- **540x360 entrance — passed in Chromium and WebKit.** The email row is fully visible at 42px and the entrance is fully visible at 59.390625px. Both engines report no horizontal overflow and `overflow-y:auto` on the overlay. A touchscreen-emulated tap at the entrance centre reached `__guide.phase() === "vault"` in both engines.
- **Reduced-motion focus lifecycle — passed in Chromium and WebKit at 320x568.** Eight Tab presses cycled only through the visible invitation controls and body. Focus never entered the covered legacy `#signupEmail`, `#vaultHold`, or `#signupSoloEmail` controls. Each focused invitation control was the hit-tested element at its centre.
- **Pinch zoom — passed at 390x844.** A Chromium compositor pinch changed `visualViewport.scale` from 1 to about 2 in normal motion and from 1 to 2 in reduced motion. Reduced mode computed `touch-action: pinch-zoom`.
- No form was filled or submitted. There were no page errors, unexpected failed requests, or visible layout defects. WebKit cancelled the streaming hero video when the reduced-motion transition retired it; this expected cancellation was recorded and excluded from unexpected failures.

## Evidence

- Raw entrance/focus results: `/private/tmp/vctrs-responsive-redo/live-after-b234910/results.json`
- Raw pinch results: `/private/tmp/vctrs-responsive-redo/live-after-b234910/pinch-results.json`
- Chromium invitation: `/private/tmp/vctrs-responsive-redo/live-after-b234910/chromium-540x360-invitation.png`
- WebKit invitation: `/private/tmp/vctrs-responsive-redo/live-after-b234910/webkit-540x360-invitation.png`
- Chromium Vault after touch: `/private/tmp/vctrs-responsive-redo/live-after-b234910/chromium-540x360-vault-after-touch.png`
- WebKit Vault after touch: `/private/tmp/vctrs-responsive-redo/live-after-b234910/webkit-540x360-vault-after-touch.png`
- Chromium reduced focus: `/private/tmp/vctrs-responsive-redo/live-after-b234910/chromium-320x568-reduced-focus-visible.png`
- WebKit reduced focus: `/private/tmp/vctrs-responsive-redo/live-after-b234910/webkit-320x568-reduced-focus-visible.png`

This was a focused live-domain run using headless Chromium/WebKit viewport, keyboard, and touch emulation plus a synthetic Chromium compositor pinch. It does not certify physical browser safe areas, physical multitouch, or screen-reader browse behavior.
