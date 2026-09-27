# Shared-browser performance release — 27 September 2026

## Published and verified

Release commit: `163b01a29eb8b34245115ba42f5a5f33283d34f3`, fast-forwarded to `main` from `5cd51143451cf81a1c7c35bad4b461466324ec43`. The upstream receipt/touch-target investigation was preserved. GitHub Pages run `36311667426` completed successfully at 10:10:39 UTC.

Independent live verification run `36311697103` checked out that exact release, received HTTP 200 from `https://vctrsclo.com/`, and verified that the canonical homepage matched the committed page after CRLF normalization. Homepage SHA-256: `1d459dc30e4a3ced0ec3101e7da23178b4e34ab3e423c98d9cfc1ac554837c95`.

The downloaded `live-shared-browser-release` artifact (`10928827754`) contains the equality result, one passing live 412×915/DPR2.625 Chromium touch journey, screenshots, source-scope and seven scheduler-mode results. The live original hero finished, followed by signup navigation/focus checks, overview, Vault, Surface, game and return, with no page errors. Signup transport was mocked; no real signup was submitted. This published verification supersedes the candidate-only publication wording in the preceding STATUS entry.

## Changes and preserved scope

The earlier Safari-labelled geometry cache was already shared browser code, not a Safari-only branch. This follow-up extends the same approach across the current live journey:

1. Collection and signup CSS lighting pauses together only when both chapters are completely above the viewport at the full photo overview. Reverse navigation resumes the shared cycle before those chapters reappear.
2. The Vault drag-hint animation pauses before entry and while Surface or the game covers the archive. It resumes when the archive is visible.
3. The playable game cancels its animation-frame callback and watchdog timer while paused. Button, keyboard, blur, hidden-page, resize, stall and reduced-motion paths are covered. Explicit resume restores exactly one frame loop and one watchdog, without applying an extra flap or advancing the paused world.

Runtime changes are confined to `index.html`, `tools/guided/journey.js` and `tools/guided/journey.css`; the current guided builder regenerated the root. Source comparison preserves the original visible CSS definitions, artwork, fonts, image/video bytes, markup, form transport, game physics, scrolling thresholds, destinations and easing. No visible-effect removal, media recompression or browser-specific redesign was used. Historical standalone routes were not rewritten.

## Verification actually completed

| Environment and scope | Passing evidence |
| --- | --- |
| Chromium Android-sized touch profiles: 412×915/DPR2.625 with 4× CPU slowdown, 360×800/DPR3 and 844×390/DPR2 | Four completed-original-film entry journeys per profile: 12 total. Run `36311047204`. |
| Chromium desktop: 1440×900 and 1280×720 | Four completed-original-film entry journeys per size: eight total. Same run. |
| Hosted Windows Server 2025, Playwright Chromium, 1440×900 | Four completed-original-film journeys. Run `36311203643`; artifact `10928404714` was checked for four PASS rows and the exact release hash. |
| Chromium and macOS WebKit lifecycle checks | Four per engine: eight total, after static-opening setup followed by normal motion. Finalization run `36311401240`. The exact-hash macOS artifact `10929153026` was checked for four PASS rows. |
| Published canonical site | One additional complete live phone-sized journey, run `36311697103`. |

Entry patterns cover normal movement, deliberate reversal, rapid repeated input, cancellation and resizing. The first pass of each full-film configuration includes the downstream Surface/game/return smoke. Lifecycle checks separately cover invisible-animation suspension, reverse recovery, game pause/resume and Vault return. Chromium tracing records zero animation-frame callbacks during the settled paused-game sample.

The finalization job also passed the source-scope guard, seven counted scheduler scenarios, 725 exact baseline-matched entry-controller states, guided-source/scroll, reveal, post-Surface, press feedback, Surface input/recovery, Vault layout and the existing game difficulty/collision/material/lifecycle/death/reachability checks.

## Measured browser work, not an FPS claim

Before/after whole-journey profiles used 1.8-second samples in Chromium at 412×915/DPR2.625 after static-opening setup and restoration of normal motion. Baseline profile: run `36309480408`, artifact `10928154519`. The compared candidate profile is from run `36310068072`, artifact `10929036302`; that individual profile/lifecycle artifact passed and uses the same frozen runtime, even though the overall early matrix was not a valid pass.

| Phone sample | Running CSS animations, before → after | Style recalculations, before → after |
| --- | --- | --- |
| Full photo overview | 13 → 0 | 108 → 10 |
| Surface | 2 → 1 | 112 → 25 |
| Game idle screen | 1 → 0 | 108 → 0 |

These observations demonstrate less unnecessary browser work in those intervals. They do not establish a whole-site speed multiplier, universal frame rate or measured battery-life improvement. Active visible effects remain enabled.

## Test-fixture corrections and limits

An early pipeline hid a failed landscape assertion; the preliminary `perf/cross-browser-release-20260927` branch was explicitly marked not approved and was never deployed. Subsequent jobs use Bash pipefail plus result-JSON count/status/hash assertions. Chromium can adjust a near-form touch onto the email input despite DOM hit-testing reporting the receipt; the existing editing protection was retained, and landscape navigation fixtures were moved clear of the form. Rapid pairs now record delivered targets and verify the second touch actually begins during the transition, without per-gesture evaluation delays.

All five Chromium journey jobs in run `36311047204` passed. Its separate macOS WebKit lifecycle job timed out at overview on pass three and is not counted as passing. Finalization run `36311401240` replaced arbitrary inter-chapter delays with actual settled-state waits and passed four lifecycle journeys per engine without changing the runtime hash. The first Windows attempt stopped before browser testing because checkout changed line endings; preserving committed line endings fixed the test setup without weakening source verification.

No physical Android or iPhone, Google-app embedded WebView, real device thermals/low-power conditions, or individual visitor's hardware was certified. Windows coverage is a hosted Chromium engine, not every Chrome installation. The earlier photo-overview entry hitches are not declared universally solved. The release removes verified invisible and paused-state overhead while retaining the approved appearance and interaction design.
