# Production game restoration

The story in candidate `52db4cb` opened an obsolete Flappy V snapshot. The actual production game remained in the root document, but preserving its source did not make it the game that the new invitation opened. The user's report was correct. This supersedes the earlier release audit's interpretation of game preservation.

## Change

`tools/production-game.cjs` extracts the playable game from `tools/vault-source.html`, verified against production commit `e972c19`. The gameplay block is identical: four courses (PILLAR, ARCH, SLANT, IRIS), original 120 Hz simulation, collision silhouette, materials, controls, start/pause/retry panels and original reward. The replacement 100 Club renderer and older engine are no longer emitted.

The host adapter connects both the painted arrow and card, locks the background with `inert`, preserves native page scroll, restores the actual opener, and cancels an unfinished entry animation on exit. The original game controls keep their production styling. The preview shares the actual renderer and portal geometry, with a visual pilot that never saves player progress. It stops when hidden, offscreen, under the playable game or when motion is reduced.

The accepted painted headings, arrow, film policy, gallery, original root page, Surface colour, archive routing and hosting files are preserved. No agents were resumed and no remote changes were made.

## Reproducible checks

- `node tests/full-experience.cjs`: 13 integration checks, including identical rebuilds and exact gameplay-block identity in the story and preview.
- The ten mandatory root suites in `docs/WORKFLOW.md` pass.
- With `VCTRS_GAME_PAGE=experience/index.html`, the difficulty, collision, lifecycle, death and reachability suites also pass against the game the new invitation opens. These include 12,500 generated gates, 106 lifecycle cases and 12 executable 100-clear physics witnesses. The witnesses are simulated input searches, not human play sessions.
- `node tests/release-handoff.cjs`: 32 browser return loops and 24 fully mocked form cases pass; no external form transport is allowed by the harness.
- `node tests/demo-server.cjs`: route and video-range checks pass.
- `node tests/production-game.cjs`: six complete journeys pass in Chromium (1280×900, 320×568, 390×844), WebKit (390×844, 844×390) and Firefox (1280×900). Covers production identity and a negative control against `52db4cb`, then rendered start, pause/resume, natural death/retry, orientation change, three later-stage fixtures, reward fixture, both openers, interrupted entry, reduced-motion exit and vault return. Production gameplay SHA-256: `093ad934e7bd5db426f24bdef7469937d7dc0071e1ed51672784df9c3dcaa2d1`.

Screenshots cover the painted invitation, original start/play/pause/retry/reward screens, narrow phones and landscape. Early screenshots were taken during transition frames; the harness now waits for panel visibility. The initial WebKit scroll assertion sampled before activation; the corrected check samples the actual activation event after browser pointer-target scrolling. Neither test correction changes product behavior. The actual in-app browser also displayed the restored controls and matching preview.

## Limits

Browser-engine and viewport emulation do not certify physical Apple, Samsung or Pixel devices. Later stages and the reward screen use explicit browser fixtures; the independent deterministic physics suite checks actual 100-clear traversal. Direct canonical-domain access remains unavailable through the web reader; comparison uses verified production Git source. No publication or push occurred. The film loop-versus-replay preference is outside this game correction and remains unchanged.

Proposed lesson, candidate only: verify that the user's actual opener reaches the expected implementation. Retaining production code elsewhere in a repository is insufficient; bind the representative journey to production source identity and keep a known-obsolete negative control.
