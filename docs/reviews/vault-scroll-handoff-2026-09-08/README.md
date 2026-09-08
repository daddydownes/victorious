# Story-to-Vault animated entrance

## Report and baseline

At published `760dbb2`, native page scrolling could stop with the terminal Vault partially visible. The parent deliberately kept the archive iframe inert until its bounds matched the viewport within two pixels, but had no animation to complete that approach. This left a visible Surface control that could not yet be used.

The baseline was reproduced in isolated WebKit and Chromium desktop browsers at multiple partial scroll positions and captured on a Chromium emulated phone using trusted touch input. See [desktop before](before-desktop.png) and [phone before](before-phone.png). These are browser-engine and emulation observations, not physical-device testing.

## Requested correction

Deliberate onward scrolling past approximately 24% Vault visibility commits to a bounded 900ms entrance. Touch waits for release; reduced motion lands immediately. The archive stays inactive during approach and becomes usable after landing. Preserve the original V-and-star space, real archive, media quality, game, Surface loop, refresh and native history behavior.

## Implementation and focused evidence

Builder source checkpoint `cd1a4b8` includes the committed entrance and a transparent parent input surface while the iframe is inactive. This second correction addresses a reproduced Chromium touch dead zone just below the threshold: at 23% visible, a swipe beginning over the iframe previously produced no page movement despite parent touch events and `pointer-events:none` on the child. A temporary parent overlay isolated the cause; the final parent pseudo-element fixes it without changing any artwork. It allows vertical panning and pinch zoom and disables its hit testing when the child activates.

See [old failing touch trace](touch-deadzone-before.json), [fixed trace](touch-deadzone-after.json) and [four passing entry/pan/Surface loops](touch-guard-results.json). The latter uses deliberate 23% prepositioning followed by trusted Chromium touch input to isolate the regression; it is distinct from a full-story gesture journey. [Desktop animation](desktop-animation.png), [desktop landing](desktop-landed.png) and [phone landing](phone-landed.png) preserve the original media.

The source retains strict full-viewport activation, slow-load pending intent, native reverse cancellation, long touch-hold release, multi-touch/cancel cleanup, modifier-link behavior and existing history semantics. Resize retargets an already running animation; geometry changes cannot initiate one.

Passed: navigation VM 11/11, integration/deterministic rebuild 15/15, protected game source across three routes, 37/37 original media byte identity and the relevant opening/Surface/scroll suites. Generated root, child Vault and game preview remain byte-exact to `760dbb2`; only the story and its local development version changed. The existing [11-case history matrix](history-local.json), [paused-game history](game-history-local.json) and [embedded Surface history race](embed-history-local.json) pass with the new controller; the later input-surface change is CSS-only.

One warmed Chromium 1280×900 probe measured the 25%-visible to full entrance at 917ms, median frame callback interval 16.7ms, p95 17ms and maximum 33.4ms: one interval above 25ms and none above 34ms. There were no page errors. [Timing evidence](frame-results.json) measures callback cadence, not physical-device GPU/paint performance.

## Final browser validation

All eight [browser scenarios](browser-results.json) pass on final `cd1a4b8`: four WebKit desktop wheel/Surface loops, four Chromium portrait touch loops, four Chromium landscape touch loops, four WebKit 320px keyboard-link loops, reverse cancellation/retry, delayed child loading, reduced motion and resize during entry. Touch runs combine natural onward gestures with controlled 23% reproduction positions and verify that archive panning works after the parent input surface releases control. See [landscape](landscape-landed.png) and [reduced motion](reduced-landed.png).

Six Sol agents covered implementation, regression tests, browser journeys, child input, runtime and remote state; Astra independently reviewed source and evidence. No physical iPhone/Windows-device, physical pinch or edge-swipe certification is claimed. No real forms were submitted. Publication uses the existing GitHub Pages authorization.
