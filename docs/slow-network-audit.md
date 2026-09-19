# Slow-network audit — 19 September 2026

Audit source: `codex/slow-network-audit`, based on GitHub `daddydownes/victorious` main `9be6e84b2704fed85266a5df8ed38c7ec2c89db7`, verified against the live homepage before work. The initial audit was local only. A subsequent explicit owner request combines these fixes with refined motion demo 03 for production publication; see `docs/STATUS.md` and `docs/DECISIONS.md` for the combined release.

## Changes

- A slow hero download no longer triggers the old 1.6-second fail-open or elapsed-duration cutoff. Playback reaches its real ending. After 15 seconds without playback progress, an explicit Continue to email escape appears. Hidden-tab time is excluded by the existing motion clock.
- Original archive photographs download through four slots, nearest photographs first. The full-size feature no longer competes with the opening film. Existing embedded previews remain unchanged; decoded full originals replace them as before. The entry wait remains bounded at eight seconds, and an abandoned request releases its network slot after two minutes. Failed originals retain their retry source.
- Removed a redundant, unbounded DOM-image decode pass that could permanently lock vault input. Originals are already decoded before promotion. A gate generation prevents stale completion from interfering with a later entry.
- The second film starts loading on entry to its section. Sustained buffering exposes Retry, which cancels/reloads the stalled request without relying on a media error event.
- Switching reduced motion off restores the existing gold dust. Paused games avoid unnecessary layout measurements. Existing motion resolution, effects, physics, typography, and photo placement remain intact.

## Verification

- Original baseline at 1Mbps/200ms latency reached email after only 0.68 seconds of hero playback. Candidate under the same throttle retained playback and reached the actual 3.733333-second ending. A ten-second delayed response also played to completion.
- Pending photo requests remained at four while vault input unlocked. A held Surface film recovered through an explicit retry, with two requests observed.
- Complete vault → Surface → game → vault journeys passed in Chromium at 320px and 1440px and reduced-motion 390px, WebKit at 390px and reduced-motion landscape 844px, and Firefox at 1440px. All 33 originals loaded. No page-script errors occurred in these journeys.
- All 166 tracked binary media/font files match the base Git blob hashes, totaling 85,677,447 bytes. No media was resized, re-encoded, or replaced. Text assets have no Git content diff.
- Existing source-preservation, reveal, native-scroll, press-feedback, Surface input, game difficulty/collision/material/lifecycle/death/reachability, and image-decode tests passed. Added `node tests/network-loading.cjs` for original download bounds, entry readiness, failed/timed-out slots, and retry; added a paused-layout regression to `tests/flappy-lifecycle.cjs` (107 lifecycle cases).
- Reduced-to-normal preference test: zero dust frames before, 24 after restoration in 1.2 seconds.

Raw local evidence lives in the parent workspace's `council-runs/20260919-network-audit/`: baseline/verification JSON, cross-browser results, screenshots, preview hash, and media hashes. Preview port 8770 serves this checkout and its response hash is checked against this `index.html`.

## Limits

Browser engines were automated on Windows; physical phones and Instagram's embedded browser were not tested. Slow-link simulation and forced stalls are not every possible network. Original HD files still require their original bytes, so slow connections may buffer; these changes prevent several avoidable skips, contention bursts, and input locks. Form transport was mocked, and production hosting/cache behavior was not changed.
