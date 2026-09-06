# How the site works

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

## Flappy V redesign candidate

Branch `demo/flappy-v-redesign` contains the new game; `033db26` is the earlier stacked prototype, not the redesigned reference or a production release. The core stays tap/click/Space flight using the site's original V-and-star path, with the existing gravity and flap impulse.

The canvas has a fixed 420×720 logical arena, uniformly fitted inside `.flap-flight-space`. Native HUD, pause/exit and stage progress sit outside it. Non-control overlay space accepts flight input so landscape margins remain useful. `flapSize()` changes raster resolution on physical resize, pauses play and preserves all logical geometry. The DPR/backing raster is bounded. Landscape displays a smaller arena rather than changing the course difficulty.

| Gates | Cumulative challenge | Final opening | Width |
| --- | --- | --- | --- |
|1–25|Fixed gates|156→148|50|
|26–50|Falling pins|144→138|54|
|51–75|Pins and shifting openings|136→126|58|
|76–100|Pins, shifts and squeezing locks|116→104|70→82|

Values are logical pixels. `flapLevel()` uses zero-based gate serial and caps at3; spawn-time score cannot delay or mutate the next tier. `flapPace()` targets185→260 logical units/s with exponential settling, while `flapInterval()` gradually shortens spacing. `flapSpawn()` builds 3–5-gate climb/descend/alternating/level phrases. `flapRandom()` uses per-run xorshift state independent of cosmetic randomness. `flapGateUpdate()` eases deployment/shift/squeeze to rest before collision range, measuring warning against maximum world speed and the logo's full circumradius.

`flapTraceLogo()` flattens the same source SVG used by `Path2D`; `flapLogoContours()` caches the rotated V and star. `flapCollision()` compares those separate concave contours to `flapPolePolygon()` using edge contact and containment. The V's empty centre is preserved. Curve approximation is below 0.048 logical pixels, but120Hz collision sampling and raster antialiasing are not literal pixel-perfect continuous collision. Pole rendering uses 14px caps with 6px clipped corners; partially revealed caps scale vertically, and the collider matches that scale. Keep the visible shape and collider changes coordinated. Score waits for the actual silhouette to clear the trailing edge.

Sprites cache the shaded front/side faces and gold bevels. The playfield has no travelling words, floating score text, camera flash or bokeh streaks. A short simulation-derived trail accompanies the unchanged logo. UI uses clear ENTRY / FALLING PINS / SHIFT / LOCKDOWN labels and 0/25/50/75/100 progress. Reward keys and code remain; the reward action says Play again because it resets the run. Explicit retry works immediately, while canvas accidental-tap protection stays.

`python3 tools/flappy-demo.py` serves `http://127.0.0.1:8938/demo` with 0/25/50/75 shortcuts and a static Pole detail study. It reads the current index, adds local-only controls and uses separate demo storage keys. These shortcuts are not added to the production page. `/` serves the unmodified candidate for real journey testing.
