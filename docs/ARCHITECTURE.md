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
