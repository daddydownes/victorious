# Local V-style demo — September 8, 2026

This branch is a reviewable local concept built from production `81ab8673aa7d0739a0571bfdb077262d72785500`. It is not published.

- Direct review: `http://127.0.0.1:8922/experience/#play`
- Full story: `http://127.0.0.1:8922/experience/`
- Branch: `demo/v-style-20260908`
- Reviewed implementation checkpoint: `7a9155500ba888a097c2eb4ca809ef15dfd3e343`

The story uses new 1536×1024 vector headings for `Play the game` and `Back to the vault`, plus a 1280×1280 vector play arrow. They use only canonical hot gold `#f0d492`, transparent backgrounds, clean flared serif shapes, rounded drips and sparse edge flecks. The existing pending text, decode, failure and reduced-motion behavior remains in place.

Flappy V uses a dedicated procedural paint module injected by the production-game adapter. Canonical V-and-star marks and their drips stay clipped inside each existing obstacle polygon; a low-alpha backdrop V is baked once into the static scene. The protected logo, collision, traversal, physics, spawn, progression and rendering functions match the production baseline. Playable routes keep 25-clear sections and the 100-clear reward; only the automatic preview cycles styles every ten.

Completed at the checkpoint:

- `tests/v-style-demo.cjs`: protected source identity, canonical V path, asset geometry/colour and route cadence passed.
- `tests/full-experience.cjs`: 16/16 integration and deterministic-build checks passed.
- Existing game material, collision, difficulty and preview simulations passed in the owner worktree: 12,500 gates / 76 traversals, 16,016 aperture samples and 1,800 automatic-preview clears.
- A delayed-asset Chromium phone check passed: readable pending text, exact title/cue geometry before and after decode, zero resulting layout shift, and a complete Back-to-the-vault paint reveal.
- A warmed three-second frame sample measured p95 17.5ms, max 17.7ms, zero frames above 25ms and no long task. This is a synthetic centred-gate sample on the shared machine, not a physical-device result.
- Native Safari verified direct-anchor loading, preview animation, game start and flap input, Escape focus return, both new titles and the vault action.
- WebKit touch journeys passed at 320×568, 390×844 and 844×390: launch, start, flap, pause/resume, death/retry, Escape and focus restoration completed with no overflow or page error. The harness waits for the moving entrance before calculating tap coordinates.
- Independent source/art review found no blocker for a local demo.
- Served story and Play-title bytes matched the local files (`46c781939c91…` and `8523bfd1193b…`).

Browser fixtures and emulated viewports do not establish physical-device, assistive-technology or human-difficulty results. No form submission occurred. Existing media were preserved; the only new media are the three SVG concept assets.

Representative game states: [start](desktop-start.png), [25 / arch](desktop-25-arch.png), [75 / iris](desktop-75-iris.png).

Title and mobile evidence: [pending fallback](chromium-phone-play-title-pending.png), [decoded Play title](chromium-phone-play-title-ready.png), [completed vault reveal](chromium-phone-vault-title-revealed.png), [title results](title-results.json), [mobile game results](mobile-game-results.json), [frame sample](frame-timing.json).
