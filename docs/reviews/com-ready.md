# VCTRS dot-com readiness

This candidate builds on `31599b5`, preserving the approved full experience and restored production game. It is prepared locally for the existing custom domain; this review is not a deployment record.

## Final changes

- Centre the Back to the vault artwork, its button/label and the VCTRS gallery mark. Keep the spray animation and arrow, without moving the other sections into a new layout.
- Delay the story film until its section is actually visible. The previous observer started playback when the section only touched the viewport edge: at scroll zero, a 720px-tall opening and a section top of 720px, the hidden film had already advanced by about a second. An explicit visibility threshold fixes this; the regression checks both zero-area contact and normal playback/re-entry.
- Keep the current end-only Replay behavior, the source-second-4 film cut, original V/star and matching gold, six gallery photos, and native story scrolling.
- Keep natural preview hops, all obstacle shapes visible, no following stroke, ten-clear style cycles and the original game/reward at 100.
- Add production canonical/social metadata with the approved share image, sitemap and robots discovery. Exclude the embedded automatic preview from search indexing. Local auto-refresh never polls on production hosts.
- Load final gallery photos lazily. The production-origin Chromium check requests none of the six photos or the story video at the opening; the later gallery check loads all six successfully. This is an observed loading change, not a measured mobile-speed score.

## Verification commands

Final results on September 7, 2026:

- Eight consecutive natural full journeys: four Chromium desktop and four WebKit phone-sized passes. Actual entrance/film/replay/game death/retry/exit/vault/history/restart, with no page errors.
- Three production-shaped origin audits across Chromium, WebKit and Firefox: correct public metadata, exact asset casing, no production reload polling, no initial story-video request, all six gallery images available, centred title/button/mark and usable reduced motion.
- Eleven desktop, narrow-phone and landscape visual configurations plus image-failure fallback passed. Screenshots of the centred artwork, CTA and gallery were inspected. Separate 320/390/1280px measurements confirm the button label is centred and does not overlap its arrow.
- Thirty-two repeated return loops and twenty-four mocked signup cases passed. These were run before the final centering and visibility-only changes; the later full journeys cover the updated layout/film path. No signup logic changed in this pass.
- Fourteen integration checks, deterministic rebuild, all ten mandatory root suites and the demo-server/range checks passed. The game reachability suite replayed twelve seeded 100-clear courses successfully; this is not a human difficulty rating.
- `git diff --check` passed. Original production media, approved share assets and hosting/ownership files have no diff against the pinned upstream source.

Run the server with `node tools/serve-demo.cjs` and execute these from the repository root. Browser tests require the already installed Playwright package and browser engines.

```sh
node tools/build-experience.cjs
node tests/full-experience.cjs
node tests/release-ready.cjs path/to/release-evidence
node tests/release-journey.cjs path/to/visual-evidence
node tests/release-handoff.cjs path/to/return-evidence
node tests/demo-server.cjs
git diff --check
```

Also run the ten mandatory root suites listed in `docs/WORKFLOW.md`. The previous game correction's dedicated `tests/game-hop-cycle.cjs` remains available for the unchanged preview physics.

`release-ready.cjs` checks exact asset filename casing for static hosting, canonical/share metadata, production-host reload behavior, delayed media, gallery loading and centred elements. Its complete journeys use native media playback and actual UI input through the original entrance, vault, Surface, story film/replay, game death/retry/exit, browser history and restart. It does not force media time or game state.

All test traffic is either local or fulfilled from the local server. Forms use isolated mocked responses and cannot submit to the external endpoint. The production-shaped test origin is `https://release.vctrs.test`; it is not the live domain. WebKit's native video loader cannot use the intercepted fictional host, so its natural media journeys run on loopback; its separate metadata/asset audit still exercises the production-shaped origin. This provider limitation is distinct from a website defect.

## Hosting and release boundary

Read-only GitHub checks confirmed upstream `e972c19`, Pages built from `main` and `/`, custom domain `vctrsclo.com`, and enforced HTTPS. Original production media, share assets, `CNAME`, `.nojekyll` and Google verification contents remain unchanged. The canonical web reader refused the live URL, so direct live-page verification is not claimed.

The complete release branch contains both generated public pages and their required media. No dependency installation or runtime server is needed on GitHub Pages. After an explicit publish instruction, fetch upstream again, review any intervening changes, and publish the reviewed branch without force using the workflow in `docs/WORKFLOW.md`. Then verify Pages' resulting commit and both public routes and media. Do not treat a successful push as deployment verification.

Physical Safari, Apple/Samsung/Pixel hardware, mobile browser chrome and low-power autoplay were not available for certification. Browser-engine and viewport checks establish the behavior tested, not universal device perfection. No new agents were used, and no independent cold-review certification is claimed.
