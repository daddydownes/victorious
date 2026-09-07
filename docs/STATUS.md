# Current status

## September 8 production release

Release `b234910759464b5fed809e35d36909f46977afe5` is published on `main` and was built successfully by GitHub Pages. It fixes the reproduced short-viewport entrance block, reduced-motion background focus leak and Vault zoom block, premature/stale signup receipt, permissive double-dot email check, and pending story-art readability. The story film now distinguishes an intentionally reduced-motion `Film paused` state from a real `Loading film` state. Root and story Flappy V use the requested 25-clear sections; only the automatic preview cycles every ten clears. The reward remains at 100.

The last application-code commit is `a05c186`. All 37 media files remain byte-for-byte identical to the saved production source, and normal-size geometry and accepted effects are preserved. Static integration passed 16/16; focused release checks passed 8/8; desktop journeys passed 4/4; WebKit portrait and landscape journeys passed 4/4 each; final story film-state checks passed 4/4. After publication, canonical root, story and preview responses matched the release byte for byte. Focused live mobile and story/game checks passed without submitting a form. These are browser-engine and emulation results, not physical-device or assistive-technology certification.

See the [production release review](reviews/production-release-2026-09-08.md) and its [durable evidence index](reviews/production-release-2026-09-08/README.md). The review distinguishes addressed blockers from lower-priority accessibility, content, contrast and safe-area observations that remain.

## Live reconciliation and 25-clear repair candidate — September 7, 2026

Fresh GitHub reconciliation found that the earlier `e972c19` checkout was stale. GitHub `main` and the latest successful Pages build were both `46226be139353d81947499ec5552c52547d68011`; fresh copies of `/`, `/experience/` and `/experience/game-preview.html` matched that commit byte for byte. The deployed adapter had unintentionally applied the automatic preview's ten-clear style cycle to both playable game routes.

The current repair candidate restores the playable root and story games to four 25-clear sections: pillars at 0–24, arches at 25–49, slalom at 50–74 and final lock at 75–99. Speed, spacing and openings continue their original gradual progression inside those sections. Only the automatic, non-scoring preview cycles its visual styles every ten clears. The reward remains at 100.

The authoritative source is `tools/production-game.cjs`; `node tools/build-experience.cjs` regenerates root `index.html`, `experience/index.html`, `experience/game-preview.html` and `experience/state.json`. The repair is saved locally as commit `a272869` on `fix/flappy-progression-20260907`. It is not live until it is published and verified against the canonical responses. See [the session audit](reviews/session-audit-2026-09-07.md) for baseline hashes, scope and validation.

## Film loading and continuous playback — September 7, 2026

A reproduced WebKit media-backend pause immediately after the native loop returns to zero is handled with one guarded resume attempt. It runs only while the scene is visible and motion/playback are allowed, and resets after playback advances. This does not override offscreen, hidden, game or reduced-motion pauses.

The story film now loops automatically without Replay. A softly moving loading surface occupies its exact scrolling panel until playback begins, then fades away. Buffering restores the indicator over the last frame. Playback and loader motion pause offscreen, behind the game, when hidden or under reduced motion. A contextual Play film recovery control appears only after playback is blocked or fails. The background VCTRS retains its exact path with a shaded gold face and crisp depth instead of the blurred glow; desktop gets a slight perspective treatment.

Passed: real delayed HTTP media and native looping in Chromium/Firefox at 4x and WebKit at normal speed; offscreen/game/reduced-motion pauses; desktop/mobile screenshots; Chromium network-failure recovery; 16 integration/rebuild checks; all ten root suites. Run node tests/film-loop.cjs with the demo server running. These are browser-engine checks, not physical devices. This follow-up is covered by the current publication authorization.

## Final motion and release — September 7, 2026

The Play the game artwork now stays complete during fast and reverse scrolling. A small scroll-driven rise settles the game card, while a restrained light breath keeps the original spray texture alive. Back to the vault retains its paint reveal. Gold capsule controls have a passing highlight and stable pressed/focus states; the signup invitation has a brief two-line entrance. Motion pauses outside the viewport, behind the game, when hidden, and under reduced motion.

Removed the repeated VCTRS mark between Enter the vault and the six photographs at the user's request. The original game, 100-point reward, video/replay policy, original entrance and return navigation remain. This historical release used ten-clear styles in the playable game; the current repair above supersedes that cadence. See [final motion and release evidence](reviews/final-motion.md). Browser-engine checks are not physical-device certification.

## Dot-com release candidate — September 7, 2026

Prepared the complete site for its existing GitHub Pages domain. The Back to the vault artwork, its button and button label now share one centre line; the VCTRS mark is centred above the six photos. Their artwork, spray reveal and existing navigation are preserved. This historical candidate used ten-clear style changes in all game surfaces; the current repair above restores 25-clear playable sections while retaining the ten-clear automatic preview and 100-point goal.

Fixed an offscreen film-start defect: IntersectionObserver reports an edge touch as intersecting even when none of the story section is visible. The film now waits for actual exposure, so it cannot finish behind the opening V. Retained the accepted end-only Replay control. The gallery loads lazily, and the story now has canonical/share metadata using the existing approved artwork and favicon. Added the two public routes to a sitemap; the automatic game preview is marked noindex.

Eight complete natural journeys passed, together with three production-origin audits, eleven visual configurations, 32 return loops, 24 mocked signup cases, fourteen integration checks and all mandatory root suites. Exact commands, hosting state and the distinction between engine tests and physical-device checks are recorded in [the dot-com readiness review](reviews/com-ready.md). This is a saved local release candidate, not a published change. Agents remain stopped.

## Natural preview flaps and faster style changes — September 7, 2026

The preview now flies with the production tap impulse and gravity. Removed both the sinusoidal float and the subsequent route-guide corrections that pulled the V into position. The pilot chooses when to flap; it never adjusts the V's position to meet a gate. A centred, gently varying preview route keeps the full arches, slanted rails and rocky jaws inside the card. Preview openings are wider for this automatic demonstration; the playable openings remain unchanged.

At commit `31599b5`, root, story and preview repeated pillars, arches, slanted rails and rocky jaws every ten clears. That playable cadence is now superseded: root and story use 25-clear sections, while the automatic preview retains ten-clear visual cycling. The actual game still unlocks its original reward at **100** and retains gradual speed/spacing progression. Removed the short line following the V while preserving frame history for smooth rendering.

Validation: nine complete preview simulations (1,800 clears) passed collision, silhouette bounds and physics-only position checks. The rejected guide-based preview fails the new motion regression. Chromium, WebKit and Firefox rendered-preview journeys passed, with stage screenshots, frame samples, reduced-motion handling and play/exit checks. Six playable-game browser journeys, all ten mandatory root suites and 13 integration/rebuild checks pass. Reachability covers twelve seeded 100-clear courses, not a human difficulty rating. Run `node tests/game-hop-cycle.cjs` for the new regression; `node tests/production-game.cjs` checks the original source plus the explicit approved adaptations.

Saved locally on the complete-demo branch; no publication or push. Browser/viewport evidence is not physical Apple/Samsung/Pixel certification. Story artwork, scrolling and film policy were not changed in this game correction. Agents remain stopped.

## Actual production game restored — September 7, 2026

Corrected candidate `52db4cb`: the painted invitation was opening an obsolete game even though the production game was preserved in the root source. Both story openers now launch the actual `e972c19` production game, with its four courses, original physics/materials, start/pause/resume/retry panels and reward. The preview also uses its renderer and portal geometry. The root page and accepted story artwork, film policy and gallery remain unchanged.

`tools/production-game.cjs` owns extraction and the small story lifecycle adapter. Exit restores the actual opener and scroll position; background content is inert during play, preview/film pause, and closing during entry cancels the animation. See [restoration evidence and commands](reviews/production-game-restoration.md).

Passed: six complete Chromium/WebKit/Firefox game journeys with portrait/landscape screenshots; 32 return loops and 24 mocked signup cases; 13 integration checks with deterministic rebuild and exact production gameplay identity; all ten root suites and five game suites against the played story engine; demo-server routes/ranges. The actual in-app preview showed the restored game and matching preview. Browser stage/reward fixtures and deterministic physics witnesses are distinguished from human play and physical-device checks.

Saved locally; no push or publication. Physical-device certification, direct canonical-page verification and the existing film-policy clarification remain outside this correction. Agents remain stopped.

## Chat audit and release hardening — September 7, 2026

Built on saved candidate `8e7efaf`. The full chat was checked against the later accepted decisions; see [requirement audit and release evidence](reviews/release-hardening.md). The original production source, artwork and hosting files remain preserved. This pass was solo; stopped agents stayed stopped.

Fixed the Surface V/cue position shift, narrow-game score overlap, browser Forward/reload returning to the wrong scene, pending signup focus loss and a stale signup receipt after editing. Replay, game exit and signup use consistent gold controls. The game explains the 100-point surprise inside its opening screen, without adding copy beneath the painted title. `/#vault` stays in the URL for reliable returns; Start again still loads the original entrance.

Final checks pass: 13 integration checks; 32 repeated cross-engine return loops; 24 fully mocked signup cases; 11 visual/motion configurations; all ten mandatory root suites; demo-server checks; and eight natural-playback full journeys. Screenshots were inspected on desktop, phone portrait and landscape. These results are engine/emulation evidence, not physical-device certification. No real form transport occurred in this pass.

The film still plays once with end-only Replay while the conflicting loop-versus-rollback preference awaits a user choice. Physical Apple/Samsung/Pixel checks and canonical-domain verification remain before public release. The live web reader denied access; production comparison used verified GitHub source and Pages metadata. This candidate is saved locally, not pushed or published.

## Surface V colour continuity — September 7, 2026

The original V uses `--gold-hot` (`#f0d492`), while the destination V had inherited the darker `#d4af5f`. Surface also inherited an additional SVG shadow. The builder now derives one shared logo finish from the original brand token, applies it to both the Surface V and opening V, and removes the nested SVG shadow. The existing SVG path and dimensions are preserved. Other saved sections are unchanged.

The mismatch was reproduced in Chromium before editing. Afterward the exact SVG fill and shadow match through actual Surface navigation in desktop/mobile Chromium and mobile WebKit; reduced-motion direct landing passes. Thirteen integration checks and fifty Surface interaction cases pass. These are browser/emulation checks. All specialists were already complete; none were resumed for this scoped fix. Local only.

## Release candidate refinement — September 7, 2026

The vault ending uses genuine gold spray-painted Back to the vault artwork, revealed along its strokes on scroll. Removed the eyebrow, description, helper sentence and photo cue. Six photos remain intact; the orphaned closing sentence is now a screen-reader heading. Enter the vault stays a native link, and Start again is a clear 48px return control. Button feedback keeps controls visible. The accepted opening, game, layout and film/replay policy remain.

One paint controller serves both headings, with independent media-query objects, bounded canvas work, monotonic progress, quiet final speckle settlement and readable image-failure fallbacks. Independent media queries fix a reproduced Chromium case where turning on reduced motion hid the video without pausing it. Mobile vault spacing is reduced; story scrolling remains native with no speed multiplier.

Ten Astra specialists contributed distinct discovery reports, followed by implementation review and final acceptance. Browser-engine checks cover Chromium, WebKit and Firefox, portrait/landscape, pressed states, keyboard exit, native wheel travel, dynamic reduced motion and image failures. Four repeated navigation cycles and natural original entrance/game retry paths pass. These are engine/emulation checks, not physical Apple/Samsung/Pixel certification. See [release review](reviews/release-sprint.md).

Local candidate only. GitHub Pages and upstream main were verified; no public push or deployment was performed. A QA interception mistake left two invalid test signup attempts with unknown external outcome; corrected mocked tests recorded interception. No further external form tests are authorized.

## Direct game-to-vault flow — September7,2026

The user removed the entire Some things stay with you / The people / The nights / The moments / Keep exploring passage. The painted Play the game invitation now leads directly to Back to the vault. Removed both the passage markup and its controller. The new painted title and arrow, restored film behaviour and original archive are preserved.13 integration checks and629/1280px browser junction screenshots pass; no script errors or horizontal overflow. Local demo only.


## Painted Play the game invitation — September7,2026

The user confirmed replacing the large Fly the V lettering with spray-painted Play the game and removing the small typed label. A matching gold spray-painted arrow points down in stacked layouts and right on desktop. The title paints on along its lettering; the arrow reveals along its shaft and head. Both assets are genuine RGBA PNGs. The arrow remains a native Play button with a screen-reader label; preview activation is unchanged. Reduced motion shows both painted assets without their reveal animation. The restored layout, previous film/Replay behavior and original archive remain in place.

## Previous demo restored — September 7, 2026

The user rejected the latest flowing transition experiment. Restored the exact run014 builder and generated product: original Surface/opening, Portrait Depth film with end-only Replay, spray-painted Fly the V and minimal Play arrow, original memory passage and six-photo gallery. The curved camera, extra floating photo planes and looping-film experiment are removed. Local preview remains on port59408. No publishing.


## Minimal Play cue — September 7, 2026

The game invitation now contains only the painted Fly the V title and a clickable “Play the game” label with a curved animated arrow. Extra introduction, instructions, score/challenge copy, returning-player best line and duplicate preview label are removed. The arrow points down in stacked layouts and right in two columns, and stays still for reduced motion. Both the cue and preview still open the game and restore their own focus on exit. Thirteen integration checks pass; browser checks at 629px and 1164px confirmed text, arrow direction and no horizontal overflow. Local preview only, with no production release claim.

## Scroll-painted game invitation — September 7, 2026

The Fly the V artwork now paints on along its letter strokes while scrolling from the film, with transient matte spray droplets. Painted progress stays in place on reverse scrolling, and completion restores the original PNG. The heading, challenge and Play button are centred within their column; layouts up to 860px stack above the game preview. Browser checks passed at actual widths 391, 629 and 1164px, including partial/full reveal, reverse scroll, game entry and exit focus. Reduced motion and unavailable canvas retain static artwork. Local demo remains on port 59408; no push or deployment.

## Complete demo launcher — September 7, 2026

The accepted complete experience now has a saved `Start Demo.cmd` launcher and `tools/serve-demo.cjs`, opening the original entrance on localhost port 59408. The server supports video byte ranges and reuses an already-running server for the same folder. `DEMO.md` explains the full journey and how to reopen it. Visual source, film, artwork and photos are preserved from the reviewed candidate. Local only; no GitHub push or production deployment.

## Post-film invitation refinement — local only

Added a staged game invitation, a second Play button with the same entry/exit/focus lifecycle, and a 100-point challenge. Reaching 100 now shows a hidden animated 100 Club reveal on fresh and returning runs; this is a visual celebration, not a redeemable offer. A scroll-driven passage builds “The people. The nights. The moments.” before an updated vault invitation and the preserved photos. Latest feedback removes decorative rules, underlines, glow and simulated distressed type; the Fly the V headline now uses a generated transparent aerosol-lettering PNG with solid paint, fine overspray and small drips.

Thirteen integration checks pass. Desktop browser exercised new Play entry and exit (focus returns to journey-play), scroll progress and real vault links. The 100 Club panel was visually inspected in an isolated local fixture invoking the actual win handler at a synthetic score of 100; this was not a human 100-gate flight and uses a separate storage origin.


## Local complete-experience candidate — September 6, 2026

Built from `e972c19` in an isolated worktree; this candidate has not been pushed or published. The original film, PRESS HERE invitation and archive continue through Surface into `experience/`. The original gold V-and-star stays still, followed by a minimal animated Scroll label; the opening tagline is removed. The accepted Portrait Depth panel plays the supplied event film continuously from source second 4 to the end (33.1 seconds, silent). Only an end-of-film Replay control is shown. The full VCTRS wordmark remains behind the film, avoiding its duplication in the opening. Six later photos remain unchanged. Game exit restores focus and scrolling; vault and restart links return to the original site.

The film surface keeps fixed layout dimensions and uses transforms for the expanding panel. This removes continuous video-surface resizing; black title cards in the supplied footage remain. Local auto-refresh waits for scrolling and playback to stop.

Validation: `tests/full-experience.cjs` passes 13 checks; original reveal and Surface input checks also pass. All ten original mandatory suites passed earlier in this integration; only affected suites were rerun after the final control edits. Desktop in-app browser checked opening, expanding film, end-only replay, game entry/exit, real vault return, Surface landing and restart invitation. No physical-phone, Safari or real signup testing; no universal flicker-elimination claim. See `docs/reviews/full-experience.md`. Prior production history below is not a deployment of this candidate.

Historical September 6 snapshot: the user approved publishing the Flappy V redesign after reviewing its visuals, mandatory openings, death animation and win screen. Production at that point was `cf51ffc`; the verified September 7 live baseline is `46226be`. Preview-only statements below record earlier iteration stages. Use the top section for current state.

## Current production state

- Live at https://vctrsclo.com, published from `main` / repository root on GitHub Pages.
- Approved share card: opening white V/star on black, 1200×630, `assets/share-v-20260906.png`; `og.jpg` is the matching JPEG.
- Main invitation: **PRESS HERE** with **ENTER THE VAULT** beneath. Tap/click/keyboard entry.
- Reveal waits for the final animation, preventing the previous settling jitter.
- Top-right circular vault logo removed at the user’s request.
- Screen-edge effects removed: no viewport-wide vault focus outline or pulsing post-Surface bottom glow. Keyboard focus uses the local drag cue and control indicators.
- Gold Lift Surface button: gold capsule, rising reflection, 48px target; reduced motion keeps static gold styling. The Space-key activation issue is fixed.
- Approved press feedback: continuous gold surface, contact-origin light and smooth release, no inset frame. Reduced motion disables the moving light and text displacement.
- Button light sweep every 2.7s, synchronized with the logo’s 5.4s cycle. Reduced motion disables those effects.
- Desktop post-Surface wheel/trackpad travel is 20% gentler than the previous accelerated version. Phone touch behavior is unchanged by the latest adjustment.
- Page and social title: **VICTORIOUS — The Vault**.
- Meta description, Open Graph and Twitter description: **Discover VCTRS (Victorious), a Canberra clothing brand. Explore the vault and sign up for updates.** Keep this evergreen.

## Approved release — fullscreen Flappy V

The user rejected the portrait-frame redesign (`44401b5`) and asked to retain the original live game's fullscreen black-and-gold atmosphere and animated background. The current candidate restores that presentation while introducing visibly different obstacles every 25 successful clears. The V-and-star logo and tap/click/Space physics remain.

Stages: 0–24 dimensional pillars; 25–49 floating, deploying arches; 50–74 diagonal passages; 75–99 heavy closing jaws with smooth rounded lobes. All use a shared polished black-metal/brass material and shared draw/collision polygons. Every opening is mandatory: crossing its mouth above or below the channel ends the run without a point. The last jaws preserve a 104-unit minimum opening. Original gold dust, bokeh, parallax and streak animation are restored. A discovered resize/input race is fixed so a resize pause cannot secretly apply a flap.

Death animation refinement after `a1941ad`: small upward recoil, gentler gravity, ten gold particles, a .24–.74s logo fade and a fixed .78s ending. Course travel eases down exponentially; dying frames now use the same interpolation as play. Retry panel has a 180ms entrance only when reduced motion is not requested. Twelve height/cadence death cases verify recoil, duration, input lock and retry; 106 lifecycle cases and collision/reveal checks pass. Difficulty checks also pass, and desktop Chrome reaches the retry panel after a fresh run. This was not a frame-by-frame animation or physical-device audit. Active-flight physics and mandatory-opening rules are unchanged.

Mandatory passage update after `ba46c76`: the user wants going above/below arches, slalom and jaws to fail. `flapTraversal` now ends the run at an outside mouth crossing or channel departure. Approach remains recoverable before the logo centre reaches the mouth; physical rail hits still use the visible silhouette. Start copy explains the rule. Difficulty checks include fatal bypasses across five viewport sizes and six approach/crossing boundary cases. Collision (254), lifecycle (106) and embedded-script/reveal checks pass. Twelve complete physics-driven flights (1,200 clears) also pass with the mandatory-route rule. Updated start instructions verified in Chrome. No new physical-device testing.

Minimal finish refinement after `ab722e6`: removed etched panels, diagonal machining, moving glints and thick stacked gold bands. All obstacle types share a continuous satin face and thin brass opening edge. Stretch the vertically constant material once per object to eliminate tile seams. Geometry and physics are unchanged. Material/cache checks, 254 collision checks and embedded-script/reveal checks pass; all four studies visually reviewed in desktop Chrome. This is still preview-only, with no new physical-device validation.

Latest refinement after `5c16dc0`: obstacle widths reduced about 16–21% (42/54/60/68→78 reference units). Pillar ends now use rounded sampled corners shared by rendering and collision; material transitions are softer. All four revised stage studies inspected in desktop Chrome. Updated collision suite passes 254 checks; difficulty, material, 106 lifecycle cases and 12 full-flight witnesses / 1,200 clears also pass. This remains a preview, not a deployment or physical-phone verification.

The user requested five Sol and two Astra agents; runtime concurrency/thread limits prevented that roster. One new Sol specialist completed five design/implementation/visual passes while two existing reviewers handled geometry and physics in parallel. Do not claim seven simultaneous agents. The final Chrome review approved the rounded-jaw direction after rejecting an earlier shallow version.

Current evidence: 12,500 generated gates, 242 grouped collision checks with 16,016 boundary samples, 12 complete physics-driven flights (1,200 genuine clears, exactly 25 of each type), and 106 lifecycle cases. Material tests verify clipping and the 64-entry / 16 MiB sprite-cache limits. Native desktop Chrome checked all four design studies, fullscreen layout, original atmosphere and live pause/resume. These are not physical-phone, universal browser-performance or human difficulty guarantees. See the [fullscreen review](reviews/flappy-fullscreen-review.md).

Run `python3 tools/flappy-demo.py`, then open `http://127.0.0.1:8938/demo`. Click a stage to inspect its design with moving ambience; **Play this stage** starts a real test flight. **Preview win** invokes the actual win presentation at 100 in isolated demo storage; desktop Chrome verified the VAULT UNLOCKED / VAULT-100 panel and gold burst. Preview storage is separate from saved live rewards. `/` serves the unmodified candidate. Publication is explicitly authorized. The full four-pass browser/device matrix remains incomplete and is deferred for follow-up; do not describe this as a universal device QA pass. See the release record in `docs/reviews/flappy-release-2026-09-06.md`.

Screen-edge removal already live: no viewport-wide vault focus outline or pulsing bottom glow. The PC scroll retune remains separate from phone touch behavior.

## Google status — pending observation

Search Console ownership was verified and a homepage indexing request was confirmed. At the last observation, Google still showed an old dated/open snippet, and its last crawl was August 29, 2026. The current metadata is live, but a refreshed Google snippet has not been verified. Do not resubmit indexing repeatedly or promise exact snippet text; Google selects its own snippet.

## Verification actually completed

| Work | Evidence and limits |
| --- | --- |
| Latest desktop retune | Offline extracted-handler checks ×4: 100px wheel input moves 92px instead of 115px; sustained fixture 1178px instead of 1472px. Reversal, bounds, bypasses and touch behavior pass. Touch handler source unchanged. Live homepage exactly matched published source. No new full browser journey for this numeric adjustment. |
| Reveal repair | Normal/reduced-motion handler checks ×4; prior Chrome frame sampling on desktop, phone portrait/landscape and reduced motion found final movement below .001px instead of the old ~3.37px snap. |
| Lighting synchronization | Prior desktop and emulated-phone 12.5s samples found matching start/current times and 5400ms duration for all four effects; no layout movement. Reduced-motion effects absent. |
| September 6 network double-check | Homepage exact match, 24 resource byte checks, canonical redirects, approved artwork and video range loading passed. |
| Prior broader browser QA | Desktop/emulated-phone vault and game journeys exercised. Historical reports have narrower commit/environment scopes; none establishes universal physical-device coverage. |

`tests/` contains portable focused reproductions, not the complete old browser recordings. Older frame logs and screenshots were kept on the original workstation and have not been uploaded. Real physical iOS Safari and actual Instagram/Snapchat-generated cards remain unverified in this session.

## Known issues carried forward

These findings were recorded in earlier QA and have not been fixed by the metadata/scroll changes. Reproduce against the current commit before working on them.

| Issue | Reproduction / scope |
| --- | --- |
| Extreme zoom clips controls | Desktop 400% zoom can put signup/vault controls below a wheel-locked viewport; 200% fit in prior checks. |
| Premature footer receipt | Submit footer/legacy form with mocked delayed or failing transport; Received appears before completion and reverts on failure. |
| Hidden form in reduced-motion tab order | Fresh reduced-motion load, then Tab; invisible legacy email controls can receive focus. |
| Premature live-region receipt | Hidden `seamRcv` exposes receipt text before signup. |
| Crew image sizing | Twelve generated lazy images omit intrinsic dimensions. |
| Signup state inconsistency | Main next-drop success does not suppress the later footer ask; duplicate submission remains possible. |
| Permissive email validation | `goodEmail` accepts some malformed domains, e.g. `a@b..com`. |
| Input contrast | Placeholder and border visibility merit a focused accessibility check. |

Owner for triage: next maintainer working with the site owner. These are recorded as deferred follow-ups, not as fixed or release-approved. The stale share-image issue is fixed and must not be reopened from old reports.

September7 launcher validation: real root and directory redirect, three MP4 byte-range forms, range rejection, HEAD, missing path, dotfile blocking, method restriction and repeat launch pass. In-app browser completed original entrance → PRESS HERE → vault → Surface → event video playing → game open/exit with restored focus → real vault return → full restart. Root/story styles, scripts, videos, images and fonts retain their reviewed hashes. This is a desktop/panel browser check, not a new phone/Safari release audit.
