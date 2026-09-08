# Refresh and browser-history audit — September 8, 2026

The user requested that an intentional browser refresh restart the original website opening from any part of the experience. Browser Back/Forward preserves the previous part; no new modal history entries or browser-navigation traps are introduced. Saved scores and reward state remain intact.

## Baseline findings

At published `229123d`, refreshing `/#vault` reopened the Vault and refreshing `/experience/` retained the story route and anchor/scroll. Ten browser scenarios recorded these behaviors across WebKit and Chromium desktop/phone emulation: [baseline](reload-baseline.json).

A full Chromium BFCache witness showed `pageshow.persisted=true` on Back to the root Vault followed by a forced network reload; Forward restored the story from cache. See [cached-history baseline](bfcache-baseline.json). The regular Playwright headless shell did not exercise BFCache; the full Chromium channel with BFCache enabled did.

## Implemented correction

Top-level reload guards run before journey initialization. Root reload clears fragment/query before selecting its opening state; story reload replaces its current entry with the root URL. Iframe reloads are excluded. Root BFCache restoration reconstructs the Vault in place and cancels stale Surface motion.

The embedded Vault reannounces its actual cycle on cached restoration. The parent reconciles current/pending cycles, retries an interrupted reset, and ignores stale readiness. A focused VM fixture reproduced the interrupted-reset latch failure and passes with the retry correction. This fixture is distinct from a naturally observed browser race.

Sources: `tools/build-experience.cjs`, `tools/vault-embed.cjs`; focused tests: `tests/navigation-reset.cjs`. The reload classifier uses the documented [navigation type](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming/type); cached restoration uses the [pageshow persisted lifecycle](https://web.dev/articles/bfcache).

All prior HD media, canonical logo, clean automatic preview, every-fifth playable graffiti and game physics remain unchanged. No form submissions are part of this audit. Browser-engine history traversal does not certify a physical phone or trackpad swipe gesture.

## Final validation

At source/test checkpoint `75ce999`, the reload/history matrix passed 11 scenarios, including root/story/game/embedded-Vault refresh, score/reward persistence, reduced motion and actual cached Back/Forward. Its twelfth scenario stopped at a Playwright frame-URL lookup after cache restoration; the DOM already showed the live active Vault. The corrected targeted check used the actual child button bounds with trusted mouse input, and passed the interrupted Surface→Back→Forward→Surface flow (cycle 0→1, story top, one inactive child). No product change was made to work around Playwright's frame lookup.

A separate real cached game journey passed active play→Back→Forward paused→Exit with background isolation, scroll and focus intact. Together these cover 13 focused browser scenarios. See [matrix](matrix-results.json), [corrected embedded race](embedded-race-results.json), and [game history](game-history-results.json).

Focused navigation VM checks 7/7, deterministic integration 15/15, protected game-source identity across 3 routes, original media 37/37 and relevant root reveal/Surface/scroll suites pass. The additional lost-Surface sync case is demonstrated by the VM fixture, not attributed to the browser frame-lookup failure.

Visual evidence: [desktop refresh](desktop-refresh-opening.png), [phone refresh](phone-refresh-opening.png), [cached Vault return](cached-back-vault.png), [paused game restore](cached-forward-paused-game.png). Native hardware swipe gestures were not exercised; the browser history traversal they invoke was tested with actual Back/Forward and persisted cache restoration.
