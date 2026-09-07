# Release hardening and chat requirement audit

The current candidate keeps the approved layout and imagery. This pass checks the instructions across the conversation, giving later corrections precedence over earlier experiments. Work is local and solo; previously stopped agents have not resumed.

## Active visual and interaction contract

| Request | Candidate behavior / evidence |
| --- | --- |
| Match the original .com and preserve its look | The frozen vault source exactly matches production base `e972c19`. Original assets, share artwork and hosting files are unchanged. The original entrance and archive remain the actual first part of the journey. |
| Remove the statement photograph | The Canberra statement uses the selected event film; there is no image in that section. Later gallery photos remain. |
| Restore Portrait Depth with the supplied video | The existing transform-driven media expansion is retained. `tools/edit-story-film.cjs` cuts the source continuously from second 4 to the end, silently. |
| Use V-and-star instead of repeating VCTRS | Surface and story opening use the identical original SVG path, hot gold `#f0d492` and subtle shadow. The wordmark remains behind the film. |
| Show only a simple Scroll prompt | The opening tagline, descending rule and earlier icons are absent. The Scroll word animates gently after landing. Its Surface position now matches the destination. |
| Keep the accepted layout after rejecting the flowing experiment | No snake camera or alternate column layout is active. Native story scrolling remains unchanged. |
| Make the game invitation spray paint | Genuine aerosol artwork says PLAY / THE GAME, paints in along its strokes and retains its finished texture. The arrow also uses spray artwork. |
| Remove text under Fly the V / replace its title | The old title and extra typed invitation are gone. The arrow remains a native button with a screen-reader name. |
| Explain the game and surprise | Inside the opened game: TAP / SPACE TO FLY and Reach 100 for a surprise. The existing 100 Club reveal works for first-time and returning players. Extra copy is kept away from the painted heading. |
| Remove the people/nights/moments passage | No memory passage or Keep exploring link remains in the rendered page. Play leads into the vault invitation. |
| Reimagine the vault ending; remove filler | BACK TO / THE VAULT paints in, followed by one Enter the vault link. The former eyebrow, description and moments caption are absent. |
| Preserve photos | All six gallery image references and original files remain unchanged. |
| Buttons should remain visible and return correctly | Game exit, Replay and signup share restrained gold controls. Exit and Replay have 48px targets. Pending signup stays focused, prevents duplicate sends and preserves edits. Game exit returns to the actual opener. |
| Back to the vault and Start again must differ | Enter the vault navigates to `/#vault`; Start again loads the original root entrance. The vault fragment is now retained for reload and browser Forward. A cached completed Surface page reconstructs the vault when revisited. |
| Natural scrolling across devices | No wheel multiplier or touch hijack was added to the story. Engine checks measure native wheel travel; small-screen composition and controls are checked separately from physical touch feel. |
| Save and prepare the actual website | The complete static site, builder, assets and tests are retained in the release branch. This work is not a public deployment. |

## Conflicting film instruction

The chat first requested end-only Replay, later requested continuous looping during the flow experiment, and then reverted that demo. The currently saved version plays once and exposes Replay only at the end. A follow-up choice is pending; no loop-policy change is inferred from silence. No Pause film control is shown.

## Defects found in this pass

- Chromium's reserved scrollbar gutter shifted the Surface V 7.5px across navigation. Story and Surface now reserve the same gutter. The root Scroll cue also used a different-sized box; the complete 70×64px cue now matches its destination.
- A full-length score label overlapped the game return control on 320px screens. Narrow games show the compact score / 100; desktop keeps its full label. The cached score updates when crossing the responsive breakpoint.
- Browser Forward reopened the initial invitation because direct vault entry removed its fragment. Keeping the route in the URL fixes repeat navigation and reload. Start again still intentionally discards it.
- Native disabled signup buttons dropped keyboard focus. The requests now use guarded pending state and `aria-disabled`; completion does not steal focus if the visitor moves elsewhere.
- An older story signup response could describe an address edited while sending. Completion now leaves the new value alone and clears the stale message.

## Verification

Final checks passed on September 7, 2026:

- `tests/full-experience.cjs`: 13 integration checks, including artwork identity, six photos, film behavior, restart without storage, game resize, reward and reproducible output.
- `tests/release-handoff.cjs`: 32 repeated return loops and 24 mocked form cases. Chromium at 320×568, 1280×900 and 390×844; WebKit at 390×844 and 844×390; Firefox at 1280×900; reduced-motion Chromium at 390×844 and WebKit at 1440×900. Four passes per configuration. Actual score drawing, responsive recaching, surprise hint, exact V/cue geometry, focus, reload and Back/Forward pass.
- Full natural playback journeys: four consecutive Chromium desktop and four WebKit phone-sized passes. Each plays the original film, enters the vault, uses Surface, lets the story film finish, replays it, starts/dies/retries/exits the game, returns to the vault, uses browser Back/Forward and starts again. No video seeking or forced game state; no page errors. The later form-only edit does not change this journey.
- `tests/release-journey.cjs`: all 11 desktop/phone/landscape configurations across Chromium, WebKit and Firefox pass. Paint progress, stable controls, natural wheel travel, dynamic reduced motion and failed-image fallbacks remain correct.
- All ten mandatory root suites listed in `docs/WORKFLOW.md` pass, as does the local demo-server test. The current working diff passes `git diff --check`; older preserved-source EOF notices in the overall candidate are unchanged.
- The video remains a 33.1-second, 1280×720 H.264/yuv420p file; the selected source is 37.1 seconds and the edit script trims from second 4.
- Fresh read-only GitHub checks still show main `e972c19`, Pages built from main/root, the correct custom domain and HTTPS. Original assets and hosting/verification paths have no diff against that base.

Commands are portable from the repository root. Browser tests require Playwright and its Chromium, WebKit and Firefox engines to be installed:

```sh
node tools/build-experience.cjs
node tests/full-experience.cjs
node tests/release-handoff.cjs path/to/evidence
node tests/release-journey.cjs path/to/screenshots
node tests/demo-server.cjs
```

The handoff test checks exact rendered V/cue geometry, gold, four repeated return loops per browser configuration, score/exit separation, resize, focus, reload and Back/Forward. Signup fixtures replace fetch in-page and additionally block all nonlocal traffic before navigation. No real signup submission is needed.

## Limits

The original production source and GitHub Pages configuration are verified read-only. The live web reader denied the canonical URL, so direct live-page rendering and byte parity are not claimed. No attempt bypassed that restriction.

Browser-engine tests are not physical Apple, Samsung or Pixel testing. Shipping Safari, real mobile browser chrome, touch inertia and low-power autoplay still need a device smoke check before public release. The previous sprint's external signup-interception incident remains recorded in `release-sprint.md`; this pass blocks all nonlocal traffic for QA.
