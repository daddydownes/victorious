# Production release review — September 8, 2026

## Release state

Release `b234910759464b5fed809e35d36909f46977afe5` was published from the verified GitHub Pages baseline `46226be139353d81947499ec5552c52547d68011`. The last production-code commit is `a05c186bc55f76a83f9f17c9593c712392503348`; later documentation does not change served application bytes. The release restores the requested Flappy progression, fixes the reproduced entry and accessibility blockers on the rest of the site, and makes story actions readable while artwork loads.

GitHub Pages built the exact release commit successfully. Canonical root, story and preview responses matched the reviewed files byte for byte, followed by focused live mobile and story/game checks.

## Shipped behavior

### Flappy V

- The playable root and story games change obstacle section at 25, 50 and 75 clears. Pillars cover 0–24, arches 25–49, slalom 50–74 and final lock 75–99.
- Pace, spacing and openings retain their gradual progression within each 25-clear section. The 100-clear reward remains unchanged.
- The automatic, non-scoring preview alone cycles its four visual styles every ten clears.

### Root journey

- The Next Drop invitation fits and remains usable in the reproduced 480×320 and 540×360 short viewports. A safe vertical overflow path remains available when needed.
- Covered stage and legacy controls are removed from focus and the accessibility tree for the relevant lifecycle. The transition keeps its destination inert until it settles, is cancelled or reaches its watchdog.
- Reduced-motion Vault interaction permits pinch zoom.
- The signup receipt starts empty and appears only after confirmed transport success. Timeout, late response, failure and edit-after-submit paths clear busy state without a stale success message. `a@b..com` is rejected before transport.

### Story loading

- Play the game, its action arrow and Back to the vault retain readable text while their paint images are pending. Image completion swaps to the accepted art without layout shift; decode and failure paths retain an actionable fallback.
- Reduced motion leaves the story film unloaded and reports `Film paused`. Enabling motion changes to `Loading film` only while an actual load is pending. Playback, buffering, failure, retry and visibility rules remain intact.

## Visual and media fidelity

No image, film, font or other media file changed. The media gate compared all 37 tracked media blobs with the saved production source commit `a272869` and passed 37 of 37. An attempted PNG recompression was rejected during development after Chrome rendering differed and is absent from this release.

At normal 390×844 and 1280×720 sizes, invitation geometry matched the verified live baseline. The 1280×720 invitation screenshot was byte-identical; the Vault used the same 17 archive/backdrop filenames and natural dimensions. The four generated outputs rebuild deterministically from their source adapters.

## Validation

| Scope | Result | Evidence and limit |
| --- | --- | --- |
| Focused release regressions | 8/8 passed | Chromium and WebKit: four short-entry cases, reduced focus/Vault return, dynamic motion change, mocked receipt lifecycle and pending story title. |
| Desktop full journeys | 4/4 consecutive passed, no retry | Chromium at 1280×720 and 1440×900, normal and reduced motion; mocked alternating signup success/failure. |
| Mobile full journeys | 8/8 consecutive passed, no retry | WebKit at 390×844 and 844×390; four passes each with native film loop and complete return/restart paths. |
| Reduced-motion pinch | Passed | Chromium compositor gesture changed scale from 1 to about 2 in normal and reduced modes. |
| Story film status | 4/4 passed | Chromium, WebKit, delayed-load motion toggle and injected failure/retry against the final served story bytes. |
| Static integration and build | 16/16 passed | Includes deterministic regeneration of root, story, preview and state outputs. |
| Media identity | 37/37 passed | Exact Git blob comparison; no media diff. |
| Flappy deterministic coverage | Passed | Root and story: 12,500 gates and 76 traversals each; preview: nine 200-clear routes; five seeded 100-clear witnesses. |
| Flappy browser coverage | Passed in five available contexts | Chromium desktop plus Chromium/WebKit phone portrait and landscape. Firefox was unavailable in the local Playwright installation. |
| Frame sample | No sampled stall | 181 frames per warmed three-second window; visible p95/max 17.7/17.8ms, hidden 17.5/17.7ms, zero samples over 25ms and zero measurement-window long tasks. |

The browser checks used local loopback, viewport/touch emulation and mocked signup transport. They are not physical-device, physical multi-touch, carrier-network, human difficulty or assistive-technology certification. The Flappy reachability runs and boundary screenshots use deterministic fixtures.

Selected screenshots and raw results are in the [release evidence index](production-release-2026-09-08/README.md). Earlier live defects and the original performance measurements remain in the [September 7 audit](session-audit-2026-09-07.md).

## Deferred observations

The confirmed entry, focus, zoom, receipt and slow-title blockers in scope are addressed. This release does not claim that every site issue is fixed. The following lower-priority observations remain:

- Sixteen generic archive-photo alternative texts need human-authored descriptions.
- Contrast and safe-area concerns need design decisions and physical-device evidence under the preserve-existing-visuals constraint.
- The hidden `#beyond` region during Surface needs a real assistive-technology browse test before assigning user impact.
- Main/footer and retained legacy form errors could have stronger explicit control-to-error associations.
- The retired legacy hold path still contains synthesized-click behavior, but is unreachable through the current Next Drop focus lifecycle.
- A compact 40px submit control remains intentional and was validated for the reproduced short viewport; it is not recorded as a release blocker.

No live signup submission was made during audit or release verification.

## Publication verification

`main` advanced by a normal non-force push from `46226be` to `b234910`. GitHub Pages reported `built` for that exact commit, created at `2026-09-07T14:47:25Z` and completed at `2026-09-07T14:47:48Z`, with no build error.

Cache-busted canonical fetches matched local release files exactly. A focused live-after mobile check then confirmed the full 540×360 invitation and touchscreen Vault entry in Chromium and WebKit, no covered legacy focus in eight-tab reduced-motion cycles, and Chromium zoom from scale 1 to 2 in reduced motion. One expected WebKit hero-video cancellation occurred during the reduced-motion transition; there were no page errors or unexpected failed requests.

A focused live-after story check passed in normal-motion Chromium and reduced-motion WebKit. It confirmed readable pending art, the original 1536px art after load, truthful film states, playable `0 / 100` and 25-clear copy/HUD, pause/Escape focus return, and the preview's ten-clear identity. No form was touched or submitted in either live-after check.

## Source commits

- `a272869` — restore 25-clear playable progression.
- `6794d18` — preserve the live audit and baseline evidence.
- `539470e` — fix root invitation and accessibility lifecycle.
- `c071084` — keep story actions readable while artwork loads.
- `3396ea7`, `3828cab`, `8058f9b` — add and correct focused release coverage.
- `a05c186` — clarify the reduced-motion film state.

Release output hashes (the three public HTML responses were verified canonically):

| Route/output | SHA-256 |
| --- | --- |
| `/` | `55f826246dcd237c9bb775f7bb6547c15cc5341e0b02130824d570df7ea9c86c` |
| `/experience/` | `ea6dd757f750c0737fb953330ef8c20cc96eb2c561cd6b2cef7c4ea0f78d973b` |
| `/experience/game-preview.html` | `c76be92a11feb9fc4c92d19e64f797b293273d28c17ac5c20d5a64b6ef9f1a5d` |
| `experience/state.json` | `05587108be8c7530a8af25a21689edc4c7e056ea07cf28fb0b534697ffbb235a` |

The release completed a fresh remote check, non-force fast-forward, exact Pages build, canonical byte comparison and focused no-submit live journeys. The documentation-only post-verification commit does not change these route bytes.
