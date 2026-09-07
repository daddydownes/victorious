# VCTRS release candidate review — September 7, 2026

The accepted black-and-gold layout remains. Back to the vault now uses genuine aerosol lettering with a scroll-driven paint reveal. The invitation has one clear Enter the vault link. Filler copy and the orphaned gallery sentence are removed. Six photos remain; Start again is a visible 48px action to the original entrance.

## Three rounds

1. Ten Astra specialists independently reviewed art direction, motion, wording, mobile layout, accessibility, performance, navigation, film behavior, deployment and regression suites. Three restrained art/copy treatments were compared before selecting the matching spray treatment.
2. The integrated candidate was checked in the browser. Findings corrected: blank headings on failed images, undersized restart target, excessive mobile spacing, fine pigment appearing abruptly at completion, and a Chromium dynamic reduced-motion notification issue shared between paint and film.
3. Final browser matrix, repeated navigation, asset/hosting audit and independent artifact acceptance. Detailed screenshots and raw results are retained with the local sprint evidence.

## Executed checks

- All ten original mandatory Node suites in `docs/WORKFLOW.md` passed against the unchanged root-page output, including four-stage game reachability. This is root-game coverage, distinct from the integrated story game.
- `node tests/full-experience.cjs`: 13 checks pass, including exact V-star geometry, six preserved photos, routing, restart without storage, video surface geometry, end-only Replay, game resize, 100 Club and deterministic rebuilding.
- `node tests/release-journey.cjs`: Chromium at 1440×900, 1280×720, 320×568, 360×800, 390×844, 412×915 and 430×932; WebKit at 390×844, 844×390 and 1440×900; Firefox at 1280×900. Checks painted progress/completion, no overflow, stable pressed controls, 44px-or-larger final action targets, keyboard game exit/focus return, native 300px wheel travel and dynamic reduced-motion film pause.
- Network-failed title and arrow assets expose readable text controls. Browser QA blocks all nonlocal requests by default.
- Four consecutive journeys exercise both Play controls, exit, vault return, Surface, restart, browser Back and Forward. Separate natural journeys exercise the original wheel-started film, PRESS HERE entrance, game start, death and retry. No stranded inert state or page errors were observed.
- Existing paint settles without further canvas draws while idle; production hostnames make no local auto-refresh requests. Final paint uses the same bounded scheduling and removes its canvas at completion.
- Upstream main, the candidate's original base and origin/main matched during the read-only release check. GitHub Pages API confirmed main/root, the correct custom domain, HTTPS and a successful build of that upstream commit. Hosting/verification files are unchanged.

## Evidence limits and release boundary

These are headless browser-engine, viewport and touch-capability simulations on Windows. Shipping Safari on macOS/iPhone, physical Samsung/Pixel touch inertia, mobile browser chrome and real network conditions are not certified. The physical-device journeys in `TESTING.md` remain the final external smoke check before publication. Root legacy pause/resume controls are covered by source regression suites, not forced open as a fabricated visible path in the story journey.

No public push or deployment was performed. Deliver the entire `experience/` directory with the root page; a tracked-only update that omitted the new directory would break Surface navigation. The complete candidate and its source builder are saved together.

The full staged whitespace check reports trailing blank lines at EOF in the preserved game-preview source and its generated preview. These pre-existing snapshot-formatting notices do not affect executable behavior; the immutable input is intentionally retained. Do not describe this as a clean staged whitespace check.

## QA interception incident

Two early root signup test attempts used an invalid test address before a reviewer discovered that its interception glob did not match the full service URL. The external outcome was not captured and remains unknown. No user email was used. The reviewer stopped those attempts, corrected interception, and recorded one mocked response per subsequent root/story success/failure case. No cleanup request or further external submission was made. The portable release test now blocks every nonlocal request before page navigation and does not exercise signup submission.

## Artwork

`experience/assets/back-to-the-vault-spray-v1.png` is a 1536×1024 RGBA image created using the built-in image-generation tool; its original alpha is preserved. The [asset record](spray-lettering.md) contains the exact selected prompt and saved project path. No CLI/API fallback or manual pixel editing was used.
