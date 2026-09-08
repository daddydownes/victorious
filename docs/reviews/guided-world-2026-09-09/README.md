# Guided homepage release — September 9, 2026

Baseline: `973cb2f3faeb4ef09907ff6c33a0631a40b6fdff`. The complete approved guided journey replaces the root's redirect into the historical experience; retained routes, ownership files, canonical metadata, opening artwork, 17 vault placements and game physics are protected.

## Executed acceptance

- **40/40 fresh end-to-end journeys:** four consecutive runs in ten lanes. Chromium 1440×900, 1280×720 and reduced-motion 1280×900; WebKit 1280×900, 390×844, 844×390, 667×375, 320×568, 430×932 and reduced-motion 390×844. Opening, signup, Vault, Surface, preview, game, Exit/focus and refresh passed with stable URL, expected document count and no page errors or local missing resources.
- **Ten core suites passed:** reveal, post-surface-scroll, press-feedback, surface-input, flappy-difficulty, flappy-collision, flappy-material, flappy-lifecycle, flappy-death and flappy-reachability. Guided scroll additionally covers 120 viewport/section combinations; lifecycle covers 106 cases.
- **Signup failure checks passed:** invalid addresses, HTTP failure, network abort, invalid response, provider rejection, actual 12-second timeout, stale responses and ten rapid submits. A stalled signup does not block Vault/Surface. All transport intercepted; no test signup delivered.
- **Stress passed in Chromium and WebKit:** blocked video, rapid navigation, repeated game open/exit, early Escape, four resizes, reduced-motion switching, hidden-state suspension and focus cleanup. Zero scheduled game callbacks during sampled reduced/hidden intervals. Chromium touch scroll exercised; hidden-state dispatch is synthetic.
- **Cold network passed:** Chromium 390×844, cache disabled, 1 Mbps downstream, 200ms latency, 4× CPU. First paint 928ms, first contentful paint 2808ms, email available at 20.8s including the preserved opening sequence. Poster decoded and journey completed; already-loaded embedded game worked after network disconnection. These are one measured throttled run, not performance guarantees.
- **Source guards passed:** original opening, production signup, core physics, vault placements, canonical/share metadata, ownership files and embedded/readable source match. Representative desktop, portrait, narrow and short-landscape screenshots were inspected.

The release fixes whole-section visibility preventing preview activation on short landscape screens and unnecessary game clocks under reduced motion/hidden state. The private demo's disconnected signup and root noindex were replaced with production behavior.

## Reproduce

Serve the repository on port 4173. Install Playwright and its Chromium/WebKit browsers in a separate test environment. Set PLAYWRIGHT_MODULE if it is outside Node resolution; BASE_URL may override the server. From the repository root run the four browser scripts in this directory. They intercept FormSubmit. Run the portable core commands in [the workflow](../../WORKFLOW.md), including `node tests/guided-source.cjs`.

Test harness changes strip embedded preview JSON before extracting the actual game, provide the new Event dispatch stub, model the current worldPlay exit-focus target, assert removal of the decorative backdrop and select the guided native-scroll checks. Physics/collision assertions were preserved. The older frame-timing harness targets the former story route and is not included as a passed check.

## Limits and release

Windows Chromium/WebKit and emulated viewports were exercised; no physical iPhone or macOS Safari was available. Inbox delivery and third-party service availability were not independently tested. Cold-cache media loading can still take time on poor connections; the approved opening timing remains unchanged. No universal frame-rate, human-difficulty or exhaustive bug-free claim is made.

Independent review and production verification are recorded with the release evidence. Normal non-force main publication is authorized. Retain the baseline for recovery; use a reviewed git revert of the release if needed, never force-reset main.
