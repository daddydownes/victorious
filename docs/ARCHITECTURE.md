# How the site works

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
