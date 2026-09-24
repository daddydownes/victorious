# How the site works

## Current Vault descent, gestures and Surface

`tools/guided/collection.html` contains the Previous Drops, signup and Vault invitation. The active `tools/guided/journey.js` descent controller follows the collection's native scroll, using the same root `#vault` and photo plane for the preview and interactive archive. `window.__vaultCamera.paint()` positions that plane through the sticky photo scene; `commitVaultCamera()` hands off its exact final frame without a second photo grid. The former `enterVaultFromNext()` fade remains in the root for a restoration path; it is not the normal scroll entrance. The opening hero is independent of these controls.

The local bird's-eye candidate begins with all 33 photos inside the phone or desktop viewport, then scales the same plane toward its interactive identity transform over a `185svh` sticky section. The zoom portion covers about 0.85 phone viewport, aiming for one or two easy swipes. Its scroll mapping has no flat easing tail. `warmOverview()` requests the 640px derivatives as the visitor nears the section; the four-request queue prioritizes nearby upgrades, while the Vault readiness promise covers only the landing area. The baked `PHOTOS` positions in `index.html` place the smaller green outdoor portrait above and near the former top-right tile, with both brought inward and the green photo lowered slightly. `tests/vault-spatial-layout.cjs` checks the arrangement, and `tests/descent-motion-browser.cjs` checks all-photo framing, zoom direction and the exact handoff.

On coarse-pointer devices, the landed `#dive` scrolls natively in two axes. Its `touch-action:pan-x pan-y` reserves two-finger contact for the archive's own up-to-4× pinch handler, keeping a pinch over photographs from zooming the whole page and moving the fixed Surface HUD out of view. Both pinch contacts must start inside `#dive`; window-capture touch release and cancellation retire the gesture even if a finger ends over the HUD. The sticky photo descent uses `touch-action:pan-y` to keep vertical page scrolling while preventing browser pinch zoom on its photo field. Elsewhere, the normal viewport meta and browser pinch zoom remain available. Reduced motion uses the legacy pan path and retains browser pinch zoom, including on the photo descent. The Surface control lives in `.vault-hud`, above the photos, with safe-area/portrait clearance and a steady touch target. Its pointer-up path handles an accepted stationary touch; a following compatibility click is consumed, while detail-zero keyboard/assistive clicks use the native handler.

The descent controller remaps `scrollTop` on still-view resize or width change to preserve progress. When native scrolling and a height change arrive in the same frame, it keeps the new scroll position, avoiding a backward camera jump. `tests/vault-polish-browser.cjs`, `tests/descent-motion-browser.cjs` and `tests/vault-preview-resume-browser.cjs` cover these contracts in browser engines.

## Previous Drops collection and signup

The sole .next-drop-mark lives in .collection-intro and remains there during Vault entry. tools/guided/collection.html owns the complete #nextDrop markup, embedded by tools/build-guided.cjs. The panel is one native scroller with a full-height .collection-screen followed by #collectionSignup. Portrait phones/tablets use a two-by-two grid; wider and landscape views use four columns. Width/height constraints preserve full uncropped photos and reserve room for the bottom scroll cue. Explicit full widths prevent inherited centring from shrinking either section after resize.

The three-chevron #collectionScrollCue is a labelled button. Pointer/keyboard activation scrolls this panel to the signup section with native smooth scrolling, or an immediate jump under reduced motion, and focuses the signup heading without opening the keyboard. Manual scrolling now uses the same native mandatory chapter snap as Surface. At the bottom, a 16px, 520ms rebound with the same easing runs on the signup card. Form focus and keyboard fitting disable snapping. An active pointer press freezes the current rebound transform until after click, and lifecycle/reverse input cancels it. Reduced motion suppresses rebound. Both centred labels use a shared gold-to-ivory light pass; reduced motion keeps labels and arrows static.

The product controller waits for #nextDrop exposure before assigning sources. IntersectionObserver loads nearby images; the fallback loads all four on exposure. Each image's measured CSS width sets sizes, updated by ResizeObserver for orientation changes. Explicit intrinsic dimensions reserve space; quality-90 proportional WebP derivatives use 640/up-to-1280px sources. assets/products/manifest.json records provenance. The collection background is pure black. Stars, the ambient beam and its layout observer were removed. The signup uses a solid dark field and separate gold Join button, with the heading left aligned and Vault spacing tightened. There are no background media downloads. The original form IDs/transport, keyboard geometry controller, films and Vault assets remain.

## Conservative media delivery candidate

The root keeps original paths in `PHOTOS`. `dataset.original` retains each source; `dataset.delivery` names separate WebP copies. `vaultPhotoRect()` projects the final plane scale/offset rather than the tiny entrance transform, which otherwise makes most of the archive appear nearby. An IntersectionObserver follows desktop transforms and native scrolling with a 180px lead margin. Before Vault entry it cannot start requests. Without that API, the four-request queue loads the archive after entry. Selection follows tile size, plane scale and device pixel ratio; demand beyond 1280px uses the original, and resize can promote a loaded photo. Input readiness retains its bounded fallback.

Opening delivery is `assets/delivery/opening-1080.mp4`; Surface uses `assets/delivery/surface-720.mp4`. Timeline and cancellation controllers remain. The Surface poster is an external lazy image; `worldPreviewSource` contains the preview URL instead of its complete escaped document. The guided builder writes that preview from `tools/guided/game-preview.html`. `warm()` attaches it on Surface, and the preview only animates when its visible chapter permits.

## Signup visible viewport

The first controller in `tools/guided/journey.js` owns only the current `#nextDrop` signup panel. Focus and visible-viewport resize/scroll events coalesce into one animation frame. A valid contraction at scale 1 fits the panel to the visible height/offset and uses start alignment with auto card margins so oversized content stays reachable from the scroll origin. Local scroll adjustments expose the email row and receipt without moving document scroll, focus, value or selection. The session survives focus moving to JOIN while the viewport is contracted; viewport recovery restores the saved panel scroll. Pinch zoom suspends geometry writes. The existing CSS handles browsers that resize the layout viewport or lack VisualViewport.

Inert/aria-hidden observation retires the adjustment when entry begins. That asynchronous notification follows the existing entry handler's synchronous logo rectangle capture. No form transport or cinematic state controller is replaced. Receipt resizing can request another bounded adjustment; scrolling the panel itself does not start a corrective loop. A pointer gesture within the form temporarily defers geometry writes so keyboard recovery between pointerdown and pointerup cannot move JOIN out from under the tap. Pointer completion, cancellation or window blur releases the deferral.

## Current root: guided world (September 9)

September 20 lifecycle update: the direct child `worldStoryReturnVault` remains viewport-fixed while initial Surface loading clips scrolling. It invokes the same return path as the ending control. A visit generation owns reveal completion; playback tokens and cancellation of video-frame callbacks retire pending media work. Returning removes the old video source before the next visit prepares it again. Successful reveal hides the loading escape and transfers focus from a disappearing recovery control to Scroll down.

The live root is self-contained `index.html`. Its original opening, email, vault and game core remain in that file. `tools/guided/journey.js`, `journey.css`, `chapters.html` and `game-preview.html` own the approved post-Surface flow. Run `node tools/build-guided.cjs` after editing those sources; it embeds the preview and chapters into the root and validates inline syntax, signup and domain guards.

Surface emits `vctrs:surface` into the same document. Chapter visibility uses visible pixels relative to the smaller of viewport/section height, so oversized landscape sections activate. Scroll work uses the existing requestAnimationFrame render; game clocks stop on reduced motion, hidden state and exit. The post-Surface performance film uses assets/story-party-cut.mp4 at native 720p (24.833-second party edit). The V animates until its first frame and input stays locked until the V/film/title entrance animations finish. Loading completes automatically without a timed skip button; actual error/autoplay failures retain recovery controls, and reduced motion uses the matching poster. The opening before email separately retains its original 1080p montage. Back to the vault resets the guided controller and dispatches the existing vctrs:return-vault event; the original landing lifecycle restores the archive without navigation. Subsequent Surface visits repeat media readiness and arrival. Refresh intentionally reloads the opening without clearing saved game progress.

Vault entry bounds image downloads and decoding to four concurrent jobs, with an eight-second preview fallback for input readiness. The guided controller keeps the archive inert/busy through that bounded readiness. The root enterVaultFromNext handler now uses a 720ms opacity-only fade on the shared clock: no identity flight, forward expansion, scale change or reparenting. The collection wordmark remains in its masthead. Title/interactive readiness resolves immediately because that cosmetic title is retired; the image gate still controls input. Reduced motion skips the fade. Surface and game return paths retain generation cancellation and focus recovery. The opening film still waits for playback completion and retains its explicit stalled-media escape; the second film retains Retry/Back recovery.

The sections below describe preserved historical /experience/ implementations. **Do not run tools/build-experience.cjs to rebuild the current root:** that legacy generator can overwrite it. Historical routes and their assets are retained, but are not the current homepage journey.


## Refresh and browser-history restoration

Early builder-owned root/story scripts classify top-level navigation. Explicit reload restarts the root opening; ordinary navigation and Back/Forward keep their route semantics. Child iframe reloads are excluded, and no saved game storage is cleared.

`restoreReturnedVault()` reconstructs a cached root Vault through the immediate landing lifecycle and cancels stale Surface motion. The embedded bridge exchanges authenticated `vctrs-vault-sync` messages after persisted `pageshow`; the parent preserves current/pending cycles until the matching child is ready. `tests/navigation-reset.cjs` exercises reload guards, message authentication and interrupted reset recovery. See [navigation review](reviews/navigation-reset-2026-09-08/README.md).

## Continuous story-to-Vault loop

`tools/build-experience.cjs` ends the story with `#story-return` (spacious canonical V) and `#story-vault` (one viewport containing `#story-vault-frame`). It preloads the archive near the closing section and leaves it inert during partial reveal. Trusted onward input revealing 24% commits a 900ms parent scroll animation; a single touch waits for release, and reduced motion lands immediately. Geometry alone cannot initiate entry. Reverse intent cancels, slow loading retains a pending commitment, and lifecycle/game interruptions clear it. The target is cached during animation and updated on resize.

A transparent parent `::after` input surface covers the inactive iframe with `touch-action:pan-y pinch-zoom`. This prevents Chromium's partial-iframe touch dead zone even when the iframe already has `pointer-events:none`. The surface stops intercepting input only when the existing exact full-viewport gate activates the archive. No media transform, resolution change, top-level navigation or new history entry is involved. `window.__storyVault` exposes pending/settling state for lifecycle regression checks.

Continued forward input stays with the committed entrance. An already eligible initiating wheel/key is consumed synchronously, animation progress never pulls back escaped native forward movement, and a new single touch does not restart the timeline. During commitment, 12px of normalized accumulated reverse movement distinguishes deliberate cancellation from tiny jitter. A cancellable timeout retains the input surface at exact landing until forward input is quiet for 140ms and touch is released; there is no waiting frame loop. Hidden/game/history/reset cleanup cancels both the motion frame and handoff timer. Reduced motion lands immediately and uses the same input-release gate.

`tools/vault-embed.cjs` derives the utility `vault-embed.html` from the final root HTML. The clone is noindex, starts inert, omits the unused intro film request, and suspends shared motion while inactive. Same-origin messages validate their source and cycle token. Embedded Surface resets the parent story scroll and reloads only the child with the next cycle; ordinary root Surface still opens `experience/`. This supersedes the invitation/gallery/Start again ending described in historical sections below.

Rebuild five outputs together: root `index.html`, `vault-embed.html`, `experience/index.html`, `experience/game-preview.html`, and `experience/state.json`. The game paint adapter enables graffiti for every fifth playable pair and no automatic-preview pairs; it preserves the shared physics and original media.

## Integrated Demo 02 host motion

The story adapter in `tools/production-game.cjs` owns the bounded opening/closing clip lifecycle and input guards. `tools/build-experience.cjs` owns relevant-art decode gating and one-shot card/title/arrow arrival. Resize, reduced motion, hidden state and early Escape settle or reverse the current transition; real gameplay remains in the shared core. `tests/vstyle-motion.cjs` verifies these host behaviors. See the [integrated review](reviews/demo-02-integrated/README.md).

## Local V-style demo layer

The `demo/v-style-20260908` branch keeps the published architecture and adds two source-owned visual layers. `tools/build-experience.cjs` wires three self-contained SVGs from `experience/assets/` into the existing title pending/decode/failure lifecycle. `tools/flappy-clean-paint.js` owns procedural canvas paint; `tools/production-game.cjs` injects it only between the existing `FLAPPY METAL BEGIN/END` markers and adds one baked scene-background call. Generated root, story, preview and state files must still be rebuilt together.

Game decoration is clipped to the unchanged obstacle polygons. The canonical logo contours come from the existing production extraction, so the visual V/star and protected collision/physics source remain tied to the saved baseline. New vector assets use explicit native dimensions, flat `#f0d492` geometry and no external references. Existing raster, film, font and archive media are retained unchanged.

## September 8 release contracts

The Next Drop overlay owns focus and accessibility exposure until Vault entry completes. `setNextDropInert()` keeps the underlying stage and retained legacy seam inert while they are covered, and removes the destination from interaction until reveal settles, is cancelled or reaches its watchdog. Short viewports at or below 520px use compact spacing plus a bounded vertical-overflow fallback; normal-size geometry remains unchanged.

Signup success is transport-confirmed. The visible receipt starts empty, each request owns a token, and timeout, failure, a later edit or a superseding request prevents an old response from publishing success. Both visible signup routes use the stricter email check that rejects consecutive dots.

Story paint headings use a pending text layer until each image loads and decodes; failure leaves the action readable. The film placeholder separately reports `Loading film`, `Film paused` under reduced motion, or `Film unavailable`. Enabling motion loads the film when its section is actually visible. The source adapter in `tools/build-experience.cjs` owns these rules; rebuild all four generated outputs after editing it.

Media is a release invariant: all 37 image, font and video blobs in the September 8 release are identical to the saved production source. Do not recompress, resize or replace them without a separately reviewed visual and byte/pixel-fidelity decision.

## Published complete experience and current repair

The builder adds canonical/social metadata for the root and `/experience/`, using the original approved share image and favicon. `robots.txt` points to `sitemap.xml`, which lists these two routes. The embedded game preview has a noindex meta tag. Demo reload polling is limited to loopback hosts; production navigation and media stay relative to their current origin.

The vault invitation is a single centred grid column, with a centred button underneath and a separately positioned arrow. The repeated ending wordmark is removed; the unchanged six-image gallery follows the invitation. Gallery images use native lazy loading. The story film observer requires at least 2% of its section to be visible, avoiding the zero-area edge-contact callback that previously started the video behind the opening V.

`logoGold` is derived from the original vault source's `--gold-hot` token. Shared `logoFinish` styles both the added Surface V and the story opening V, with the same subtle shadow. Their SVGs inherit that colour and have no additional filter, preventing a colour/shadow change across the document navigation.

The ending uses `back-to-the-vault-spray-v1.png` and the shared `paintTitle` controller in the builder. Only the vault heading supplies stroke paths and brush width. The game title displays the complete original raster, with an image-error text fallback. An event-driven scroll callback changes only the preview card opacity and transform; it never intercepts input. Individual intersection observers pause title/arrow/button CSS animations offscreen, and a shared visibility/game/reduced-motion gate pauses decorative work. Per-heading reduced-motion queries isolate animation reads from the film's change listener. Progress is monotonic, the final 8% settles residual pigment, and completion removes the canvas. An image error exposes the real text heading; a failed painted arrow exposes the native Play label. Navigation remains usable without paint animation.

The vault invitation contains only the painted heading and Enter the vault link. Its mobile minimum height is zero, keeping the CTA near the art. The gallery retains six photos and an accessible heading; Start again is a 48px native link to the original entrance. Story scrolling remains browser-native.

`tools/build-experience.cjs` builds root `index.html`, `experience/index.html`, its game preview and deterministic `state.json`. Inputs are frozen `tools/vault-source.html` (upstream `e972c19`) and `tools/experience-source.html`. `tools/production-game.cjs` extracts the production game for both playable routes and derives the automatic preview from the same snapshot. The older preview snapshot is retained for history, but no longer used. Edit the builder/extractor and regenerate; do not hand-edit generated pages.

Surface reveals the original V-and-star layer above the original stage and navigates to `experience/`. Returning to `/#vault` runs the existing archive-entry landing/focus lifecycle immediately. Restart navigates to the root without fragment or query.

`experience/assets/story-film.mp4` is a silent H.264 continuous cut from source second 4 through end. `tools/edit-story-film.cjs` accepts the original source path and regenerates it using FFmpeg. Native loop playback pauses offscreen, when hidden or during the game, and honors reduced motion. The film loading layer shares the existing panel geometry. Playing fades it out; waiting restores it, while errors or autoplay rejection expose a contextual recovery control. A story-only SVG gradient and crisp offset shadows give the background wordmark depth without changing the source path. Fixed video dimensions and compensating transforms preserve the growing rectangle without per-frame video layout resizing. Local reload polling waits until video is paused and scrolling idle.

The root and story play the upstream game through explicit adaptations in `tools/production-game.cjs`. `tuneGameStages` preserves four 25-clear playable sections and their four-part HUD. Pace, spacing and openings still change gradually within each section; the section boundaries select pillars at 0, arches at 25, slalom at 50 and final lock at 75. `tunePreviewStages` and `tunePreviewMarkup` independently give only the automatic preview a ten-clear visual cycle and ten-part HUD. The 100-point reward remains. `removeTrail` deletes only the V's trailing stroke, preserving its interpolation frames. Physics, collision silhouettes, materials and start/pause/retry panels remain shared.

The story host adapter lets both painted invitation controls open the game, makes background content inert, preserves the card expansion, and cancels it on Exit while restoring the triggering button and scroll position. The automatic preview shares the renderer and portal geometry but uses a centred authored route with settled portals and wider openings. Its pilot controls only flap timing; position integrates velocity and gravity at 120Hz with interpolated drawing. There are no guide-position corrections or periodic resets at 100. It cannot award or overwrite player progress.

`tests/production-game.cjs` checks pinned production source identity plus the explicit adaptations, the previous demo as a negative control, and actual browser start/pause/resume/retry/resize/reward/exit journeys. `tests/game-hop-cycle.cjs` simulates nine 200-clear preview routes, rejects forced position changes, checks full portal bounds and collision clearance, and captures rendered motion/stages in three browser engines. `VCTRS_GAME_PAGE=experience/index.html` selects the story in the existing physics harness, allowing its collision, difficulty, lifecycle, death and reachability suites to test the engine that the new invitation actually opens.



A reproduced WebKit media-backend pause immediately after the native loop returns to zero is handled with one guarded resume attempt. It runs only while the scene is visible and motion/playback are allowed, and resets after playback advances. This does not override offscreen, hidden, game or reduced-motion pauses.

## Delivery and boundaries

GitHub Pages serves static files; there is no application server, bundler or framework. `index.html` contains the HTML, CSS and browser JavaScript, with external media in `assets/` plus root media files. Signup transport uses FormSubmit through `capture()`; the game stores progress in the visitor’s browser. Search Console and GitHub Pages settings are external services, not application code.

## Visitor journey

1. Opening V and muted inline film fill the viewport. Intro logic controls scrolling and the film-to-DOM-logo handoff.
2. `startNextDrop()` reveals the drop card, email form and **PRESS HERE** invitation. `next-drop-landed` is applied after the final reveal animation completes.
3. `nextVaultHold` activates the main entrance despite its historical name. Transfer choreography brings the wordmark into the archive; vault entry and focus must finish only once.
4. The vault displays a draggable photo plane with momentum and arrow-key navigation. Surface returns the visitor to the main document.
5. `guidePhase === 'surfaced'` enables the later page and its bounded wheel/touch scrolling. The crew strip, footer signup and game live here.
6. Flappy-V opens a canvas dialog with start, pause, retry and exit controls. It prevents background scrolling while active and restores focus on exit.

The legacy seam/hold/email route still exists in the source. It shares state and transport with newer UI; do not treat every hold reference as the current main invitation.

## Source map

Use these exact identifiers or comment headings with your editor’s search. They are more stable than line numbers.

| Feature | Search anchors in `index.html` | Main responsibility |
| --- | --- | --- |
| Search and sharing | `meta name="description"`, `og:image`, `twitter:image` | Page/social titles, evergreen descriptions, approved artwork |
| Intro and film | `V-FIRST INTRO`, `startNextDrop`, `film-end logo handoff`, `COVER+` | Opening animation, camera, film handoff, next-drop reveal |
| Shared animation scheduling | `addMotionTask`, `cancelMotionTask`, `motionNow`, `motionQuery` | Motion tasks, timing and reduced-motion handling |
| Invitation look | `.next-vault-hold`, `nextVaultSweep`, `--next-light-cycle`, `vh-press-light`, `setNextPressOrigin` | Button sizing, synchronized idle sweep, frameless contact/release light |
| Signup | `email signup`, `capture`, `captureReceipt`, `goodEmail`, `nextDropEmail` | Validation, transport, pending/success/failure states |
| Journey state | `GUIDED JOURNEY`, `guidePhase`, `setNextDropInert` | Phase transitions, scrolling and hidden-screen focus |
| Vault entrance | `THE DIVE`, `flyIn`, `landVault`, `vault-entry-mark` | Transfer, shared brand mark and arrival |
| Scroll-derived visibility | `updateScroll` | Coordinated scene presentation; must respect terminal vault/Surface state |
| Archive | `the vault: draggable photo plane`, `PHOTOS`, `startInertia` | Photo placement, pan, bounds and momentum |
| Later-page scrolling | `Post-Surface scrolling`, `postScrollAllowed`, `postWheelBudget`, `postTouch` | Separate wheel/touch input; shared settling task |
| Return from archive | `SURFACE — rise above the archive`, `surfacedReset`, `armVaultClose` | Cancellation, page restoration and Surface choreography |
| Crew strip | `THE NIGHT`, `crewStrip`, `advanceCrew` | Repeated photo strip, visibility-gated motion |
| Game | `FLAPPY-V`, `flapOverlay`, `startFlapLoop`, `COUPON_THRESHOLD` | Canvas game, lifecycle, reward display and controls |

## Important state contracts

- `guidePhase` coordinates film/email/transition/vault/closing/surfaced phases. `vaultActive`, `vaultClosing` and `surfacing` further guard transitions.
- Body classes such as `next-drop-landed`, `next-vault-opening`, `next-vault-open` and `surfaced` gate presentation and effects. Changing classes without the matching state/focus updates can leave invisible or stuck UI.
- Hidden screens need inert/focus management in addition to opacity and `aria-hidden`.
- The final reveal listens specifically for `nextDropSettle` on `nextVaultHold`; unrelated child animation events must not complete it. Reduced motion uses a short fallback.
- All four invitation lighting animations share a 5.4-second cycle and start on landed state. The button sweeps twice per cycle; the logo once. Reduced motion suppresses them.

## Scrolling values after the September 6 desktop retune

| Setting | Wheel/trackpad | Touch |
| --- | --- | --- |
| Input travel | delta × 0.92 | 1:1 finger travel |
| Gesture budget | max(336, min(880, viewport height × .92)) | max(420, min(1100, viewport height × 1.15)) |
| Continuous recovery | viewport height × .8 per second | Fresh touch gesture budget |
| Release coast | Wheel events supply their own input | Immediate lift: velocity × 150, capped at 200px and remaining budget |

Shared easing time constant remains 45ms. Reduced motion, browser zoom, editable controls, selected text and game state bypass or stop custom handling. Keyboard/focus changes retire a settling task.

## Data and integrations

- `capture()` POSTs JSON to the public FormSubmit alias in `LIST_URL`, with a 12-second timeout. There is no repository-managed signup database. Main and legacy/footer receipt handling differ; see known issues.
- `localStorage` keys `flapv_best` and `flapv_won` save game progress on that browser/device. They do not sync between devices.
- `COUPON_THRESHOLD`, `COUPON_CODE` and `COUPON_LINE` are client-visible game settings. Reward display is not server-side redemption enforcement.
- `google303d59fed389923f.html` proves site ownership. Leave its contents/path intact.
- GitHub is the shared project memory; personal browser storage and local QA artifacts are not shared project state.

## Published press feedback

The main button uses one continuous gold surface without an inset frame. A decorative `vh-press-light` follows pointer contact through bounded `--press-x/y` coordinates and expands on release in280ms. Dark lettering remains unscaled; accepted entry keeps existing timing. Keyboard and assistive detail-zero clicks reset the light to the centre. Reduced motion hides the moving light and removes text displacement; entry does not wait for any press animation.

## Gold Lift Surface control

`surfaceBtn` retains the real Surface exit handler and tap/drag guards. A 48px gold capsule contains decorative `surface-arrow` and readable `surface-label` spans. `surfaceGoldRise` runs only in the open vault, stops when surfaced, and the accepted press uses a gentle90ms shade over the gold face, with steady arrow and label, before the existing HUD fade. Reduced motion disables the idle animation and press-shade transition. The keyboard scroll trap exempts Space only on the active Surface button, preserving native activation while keeping background scrolling locked.

## Screen-edge effects retired

The post-Surface `underglow` DOM/CSS and motion task were removed, including all start/stop hooks. Vault container focus no longer outlines the full viewport; `.vault:focus-visible .drag-label` provides a local underline. Stage focus uses `outline:none`. Button focus indicators remain. Do not restore the flashing screen-edge effect from historical revisions.

## Fullscreen Flappy V candidate

The current branch supersedes the rejected portrait-frame candidate `44401b5`; historical reviews describe their own versions. The original V/star, flap impulse, gravity, saved reward keys and 120 Hz simulation remain. The viewport is filled again: `FS.h=720`, `FS.w=720*CSS aspect`, and the backing raster follows CSS height with a six-million-pixel limit. Gate width and horizontal speed scale together with logical width. The logo scales uniformly with height, so contact timing is comparable rather than perfectly identical across aspect ratios. Resizing scales existing gate x positions, preserves vertical geometry and pauses before accepting another flap.

| Successful clears | Obstacle | New challenge |
| --- | --- | --- |
| 0–24 | PILLAR | Original paired pillars, now with sculpted metal/brass faces |
| 25–49 | ARCH | Finite floating arches deploying from above and below |
| 50–74 | SLANT | Diagonal corridors, retaining deployment and approach movement |
| 75–99 | IRIS | Heavy, rounded two-lobe jaws, retaining diagonal/deployment/squeeze behavior |

Obstacle reference widths are 42, 54, 60 and 68→78 per stage, scaled by logical viewport width / 420. Pillar ends use 12 samples per quarter-ellipse; collision and drawing share these rounded contours. Material passage strokes include short curved segments to avoid broken corner highlights.

`flapAperture()` defines the open passage; `flapHazardPolygons()` supplies both collision and interpolated rendering. Jaws use a shared sampled cosine profile, including lobe centres, to keep their smooth drawing and collision boundaries identical. The neutral jaw opening widens by 48 units; opposing 24-unit lobes preserve the authored minimum opening of 104. Straight outer backs make the jaws visibly heavier than slalom rails.

`flapTraversal()` requires entry, continuous passage and full exit before awarding one point. The route is mandatory: a logo-centre crossing outside the mouth or subsequent channel departure ends the run through `flapDie()`, without scoring. Before the mouth, approach remains recoverable. This is a route rule separate from visible polygon contact. `flapCollision()` runs before scoring and compares actual rotated V/star contours with the shared obstacle polygons. Queued types use earned score plus pending unmissed objects; already visible objects do not morph after a miss. Spawn spacing follows that same anticipated progress rather than raw serial count. Gate motion settles at least approximately 0.69 seconds before the tested earliest contact.

`flapDrawMetal()` is embedded between FLAPPY METAL BEGIN/END markers. It clips a satin face and thin brass passage edge to the actual obstacle polygon. A cached 192-unit source with a vertically constant gradient stretches once across each object, avoiding tile seams and gradient rebuilds during translation or height changes. There are no etched patterns, moving glints or stacked sculptural bands. The cache is bounded by 64 entries and 16 MiB, with a 2048px tile-width cap. This does not claim a total browser/GPU memory budget. Original baked far dust, motes, bokeh, parallax and streaks restore the live site's atmosphere. Cosmetic randomness is separate from the per-run course RNG.

`flapTraceLogo()` derives collision contours from the same SVG as `Path2D`, preserving the V's open centre and separate star. Approximation is below 0.048 logical pixels; antialiasing and discrete simulation are not literal continuous pixel-perfect collision. Pausing, reduced-motion poster, background interruption, retry and reward behavior remain. `flapTap()` rechecks pause after `flapSize()` so a newly detected resize cannot also inject velocity.

`python3 tools/flappy-demo.py` serves `/demo` with stage-design selectors and a Play this stage control; only that response receives the study helper and isolated demo storage. Studies freeze obstacle movement but keep the original ambience animated. `/` is the unmodified candidate for integration testing. Tests cover geometry, silhouettes, material rendering discipline, lifecycle and executable full-flight witnesses; see the fullscreen review for exact limits.

Death presentation uses a .78s timeline independent of collision height: slight recoil, gentler gravity, fading logo and course deceleration. `flapPresentation()` interpolates dying frames too. `tests/flappy-death.cjs` covers death timing and retry at 30/60/120/144Hz. Panel entrance is CSS-gated by reduced-motion preference.

## Game invitation and memory passage

The current play-copy contains only its painted heading and the native journey-play button. Its decorative SVG arrow switches direction at the same 860px layout breakpoint and disables animation under reduced motion. The whole preview remains the second native button with its accessible name, without a duplicate visible label. The optional flapBest node and runtime motion-note paragraph are absent; the existing best-line writer already handles a missing node. Game scoring and the 100 Club reward remain in the engine.

The painted heading owns its reveal independently of the other journey fades. A fixed 1024x683 canvas masks the original 1536x1024 PNG along fourteen letter strokes; small transient particles follow the current stroke tip. Passive scroll/resize events queue bounded animation frames. Progress accumulates and settles to the current scroll target; no frame loop remains while idle. Game-open and hidden-document states suspend painting. Completion, keyboard focus or reduced motion restores the original image and removes the canvas; late image load cannot restart a completed reveal. The source image reserves layout space throughout, with no changes to film or game rendering.

The builder adds a second native play button bound to the same game-open handler and card-expansion animation. Reveal observers run once and expose content on keyboard focus; reduced motion renders static content. The memory passage uses one queued animation frame per scroll event to derive text transform/opacity from section progress. It creates no video surface resizing.

The story engine calls flapSurprise at 100 gates for every run, retaining best-score storage. The reveal timer restarts and play-again waits 2.2 seconds. It is a local visual reward; no coupon or financial redemption is promised.

The Fly the V heading uses `experience/assets/fly-the-v-spray.png`, generated with the built-in image tool and copied with its original alpha intact. Its accessible name remains real heading text. Width/height reserve the image ratio; lazy loading avoids competing with the opening film. No synthetic distressed filter, decorative divider or new-section glow is rendered. Source prompt and provenance: `docs/reviews/spray-lettering.md`.

## Painted game invitation

The title now uses experience/assets/play-the-game-spray-v1.png and hidden real heading text Play the game. PAINT_REVEAL strokes follow the new two-line lettering. The journey-play button retains its accessible name via sr-only text, while its visible content is the arrow. A nested SVG reveals experience/assets/play-arrow-spray-v1.png through an invisible stroked mask; only the raster pigment is visible. The inner SVG rotates ninety degrees on desktop, leaving the parent's directional movement intact. Reduced motion and focus bypass the mask animation. No new camera controller is present.

Current section order is opening,Portrait Depth film,play,vault-invite,ending gallery. The former memory-passage markup and its scroll/click controller are removed; legacy unused CSS remains inert. The play paint controller and reveal observer remain active.

## Rapid Vault approach

The terminal controller in `tools/build-experience.cjs` projects normalized cancelable wheel distance before native scrolling. When one step would cross the24% threshold, it scrolls to the rounded threshold and commits the existing900ms entrance. Noncancelable/native full-view jumps with recent forward intent use the normal ready/touch/quiet handoff. Existing loaded, inert, Surface cycle and history behavior remain.

The collection source includes a lightweight event timer with explicit start/end offsets. It updates only while the collection is active and the document visible; at opening it displays On now, and at closing it displays finished. During keyboard viewport fitting the event block hides to preserve input/receipt space. The form transport is unchanged.
