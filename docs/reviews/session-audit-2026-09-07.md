# GitHub/live reconciliation and session audit — September 7, 2026

## Scope

This note records the repository and deployment baseline used for the full-site audit, the reproduced Flappy V progression regression and the isolated repair candidate. Browser screenshots, device emulation and frame-time observations are recorded by their respective audit owners; they should not be inferred from the static checks below.

## Authoritative baseline

- A fresh fetch advanced `origin/main` from the stale local `e972c19` checkout to `46226be139353d81947499ec5552c52547d68011` through eight commits.
- GitHub Pages reported its latest build as `built` for that same full commit, created at `2026-09-07T02:32:56Z` and updated at `2026-09-07T02:33:16Z`.
- Fresh canonical responses matched the `46226be` repository files byte for byte:
  - `/` and `index.html`: SHA-256 `20204755bf00d57cd58a822825aa39713d720d54cd2fbaeec2ca9486143b9421`.
  - `/experience/` and `experience/index.html`: SHA-256 `577f88e5d4d6ca1ad8e2d101d99841d14544aac81e2caba25e206a411075d13b`.
  - `/experience/game-preview.html` and its repository file: SHA-256 `c76be92a11feb9fc4c92d19e64f797b293273d28c17ac5c20d5a64b6ef9f1a5d`.

The visitor's ten-clear playable behavior was therefore the deployed source, not a browser cache or an unpublished local variant.

## Reproduced regression

At `46226be`, `tools/production-game.cjs` applied one `tuneStages` transformation to root, story and preview. It changed `flapLevel` and `flapCourseProgress` to modulo-ten progression everywhere, while separate helpers retained only the gradual 25-clear pace and spacing curve. As a result, both playable routes changed obstacle family, opening, width and route complexity at 10, 20 and 30 instead of at 25, 50 and 75, then reset those properties when the style cycle wrapped at 40 and 80.

Required behavior:

| Surface | Obstacle sections | Progress behavior | Reward |
| --- | --- | --- | --- |
| Root playable game | 0–24, 25–49, 50–74, 75–99 | Original gradual pace, spacing and opening changes inside each section | 100 |
| Story playable game | Same as root | Same as root | 100 |
| Automatic preview | Cycle four visual styles every 10 clears | Natural flap impulse and gravity; wider non-scoring presentation openings | None |

## Repair candidate

Branch `fix/flappy-progression-20260907` starts at `46226be`; the validated repair is saved locally as commit `a272869`. `tools/production-game.cjs` now has separate playable and preview transformations. Rebuilding changes root `index.html`, story `experience/index.html` and deterministic `experience/state.json`; the automatic preview remains byte-identical to the verified deployed preview because its accepted ten-clear behavior did not change.

The authoritative edit path is:

1. Change `tools/production-game.cjs`.
2. Run `node tools/build-experience.cjs`.
3. Verify root and story are identical in gameplay rules, preview retains its intentional cadence difference, and another rebuild is byte-identical.

The commit remains local until it is published and verified against the canonical domain. Do not report the repaired cadence as live before that comparison.

## Repair validation and durable evidence

- Root and story difficulty checks each passed 12,500 generated gates and 76 traversals. They assert that 10 and 20 remain pillars and that section changes occur at 25, 50 and 75. Five seeded witnesses also reached the actual 100-clear reward.
- The full integration and deterministic-build suite passed all 16 checks.
- The automatic-preview pilot passed nine physics-only routes totalling 1,800 clears, including explicit style checks at 9/10, 19/20, 29/30 and 39/40. Its rendered Chromium check passed at 1280×900 after the preview extraction harness was repaired.
- The production browser journey passed Chromium at 1280, 320 and 390 pixels wide and WebKit at 390-pixel portrait and 844-pixel landscape. The combined command later exited with status 1 only because the local Firefox executable was absent; it did not report a Firefox behavior result.
- Active-renderer boundary fixtures show pillars at 24, arches at 25 and 49, slalom at 50 and 74, and final lock at 75. The [boundary report](session-audit-2026-09-07/flappy-boundaries/report.json) identifies every fixture and its limits; the adjacent PNGs are real active-game renders with seeded score and gate position, not a human 75-clear run.
- A three-second warmed Chromium sample recorded 181 frames with the background crew visible and 181 with it hidden. Visible-crew p95/max frame intervals were 17.7/17.8 ms; hidden-crew p95/max were 17.5/17.7 ms, with zero intervals over 25 ms and no measurement-window long tasks. The [timing data](session-audit-2026-09-07/frame-timing/frame-timing.json) and three stage PNGs are desktop headless-Chromium evidence from a shared machine with a synthetic centred-gate survivor. They do not establish physical-device, GPU-memory, human-play or universal smoothness behavior.

## Full-site findings on the verified live baseline

### High — a short Next Drop viewport hides the only Vault entrance

At 540×360 in both Chromium and WebKit touch emulation, the landed `.next-drop-card` is about 540 px tall inside a 360 px locked viewport. The email row begins at y=349 and `#nextVaultHold` spans y=441–516, leaving none of the entrance visible. `body.locked` and `.next-drop` prevent scrolling, and the short-height compact rules begin only at `min-width:560px`. The [mobile report and evidence](session-audit-2026-09-07/mobile/report.md) include both engine screenshots and element bounds.

### High — reduced motion sends keyboard focus behind the Next Drop screen

On a fresh 320×568 reduced-motion load, Chromium tabs through the three visible controls and then into the covered legacy email, submit button and hold control; WebKit reaches the covered legacy email on its second focus stop. `seamApply(seamGapMax())` clears `#seamGold.inert` during reduced-motion initialization even though the fixed invitation still covers it. The [focus results](session-audit-2026-09-07/mobile/focus/results.json) and adjacent screenshots capture the actual focus sequence.

### Medium accessibility risk — the open Vault does not isolate the covered opening

Current DOM metrics find the full-viewport `#stage` region visible behind the opaque landed Vault without `inert` or `aria-hidden`. This creates a source- and DOM-supported risk that assistive browse navigation can reach stale opening content. No screen-reader browse escape was exercised, so the impact remains unverified rather than a confirmed screen-reader failure.

### Medium — a success receipt is exposed to assistive technology before signup

Native Safari exposed `RECEIVED. THE VAULT HAS IT.` on a fresh opening and again on the next-drop screen, although no signup had occurred. Root `index.html` pre-populates `#seamRcv`, gives it `aria-live="polite"` and hides it only with `opacity:0`, which leaves it in the accessibility tree. This proves premature discoverability; it does not prove that a particular screen reader announces the initial live-region text automatically. Leave the region empty until success or synchronize `hidden`/`aria-hidden` with its real lifecycle.

### Medium — reduced motion prevents pinch zoom inside the Vault

The fullscreen Vault uses `touch-action:none`. `nativeVaultPreference()` rejects reduced motion, so its `pan-x pan-y pinch-zoom` override is never enabled for that preference. This is source-confirmed on the current baseline; the audit did not use a physical multitouch device.

### Medium — most Vault photographs have generic alternatives

Sixteen meaningful archive photographs are exposed as `VCTRS archive piece 1` through `16`; only the DJ photograph has a descriptive alternative. Screen-reader users therefore receive no subject information for most of the archive. This is a markup finding; the audit did not evaluate the alternatives with a screen reader.

### Medium — the Play title can remain pending on a slow connection

With a synthetic 150 ms RTT and 1.6 Mbps downlink in a mobile Chromium viewport, `/experience/` reached first contentful paint in 608 ms and its first story-film frame 9.393 seconds after exposure, while the Play section did not become title-image-ready until 25.659 seconds after entry to `#play`. The iframe had completed at 2.248 seconds, so the 2,660,132-byte Play PNG dominated readiness. Source CSS clips `.paint-title-text` until a hard image failure adds `.paint-failed`; while the image is merely pending, that design can reserve a blank title area. No pending-state screenshot was captured, so the blank-area effect is a source-backed inference. See the [slow-network data](session-audit-2026-09-07/runtime-slow/results.json).

### Low — the root email predicate accepts malformed domains

The source-level `goodEmail()` predicate accepts `a@b..com`. Empty and plainly malformed values were blocked during the live Safari journey, but the double-dot value was not submitted because that could invoke the real FormSubmit transport. This is a client-side validation gap, not evidence that the transport accepts the address.

Core Safari journeys through the root invitation, vault, Surface, browser Back/Forward, story Skip and Scroll controls, film, both game openers, exit focus restoration, ending CTA and local validation all passed. See the [live navigation report](session-audit-2026-09-07/navigation-live-safari.md) for exact steps and constraints.

The current responsive matrix found no horizontal document overflow, page errors or primary-control clipping on `/experience/` at 320/390 portrait, 844 landscape or 1440 wide, including reduced motion. Fast loopback Chromium and WebKit journeys had zero console, page or HTTP failures, zero layout shift and no tasks over 50 ms. RequestAnimationFrame p95 intervals were about 17.7–18 ms; one WebKit entry sample had two of 127 gaps over 34 ms, with a 50 ms maximum, while the other sampled transitions had none. This is browser-engine and viewport evidence, not physical-device or carrier certification. The [fast runtime data](session-audit-2026-09-07/runtime-fast/results.json) preserves the raw measurements.

## Static baseline evidence and limits

On the verified `46226be` baseline, all executable inline scripts parsed; declared relative media references existed; the builder reproduced root, story, preview and state outputs deterministically; and the focused root suites passed. The progression, collision, material, lifecycle, death and twelve seeded 100-clear reachability checks also passed for the behavior they encoded. Those baseline tests encoded the wrong ten-clear playable requirement and therefore did not invalidate the reported regression.

`git diff --check e972c19..46226be` found one existing trailing blank line in `tools/experience-preview-source.html`; it did not identify a runtime defect. Browser launches from the restricted static-audit sandbox were unavailable, so rendered behavior, perceived smoothness and physical-device performance require the separate browser audit evidence.
