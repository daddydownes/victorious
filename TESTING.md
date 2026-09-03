# VCTRS Website Test Plan

This is the release checklist for `vctrsclo.com`. Run it before every production deployment and after any change to animation, layout, media, forms, or navigation.

## Release rule

A release passes only when:

- every critical journey passes four consecutive times;
- there are no console errors, black flashes, duplicated logos, stuck screens, clipped controls, or unexpected scroll jumps;
- the VCTRS vault mark finishes at `#f0d492` (`rgb(240, 212, 146)`);
- keyboard, touch, pointer, reduced-motion, and narrow-screen paths remain usable;
- any known failure is recorded below with an owner and a decision to fix or explicitly defer it.

Do not approve a large visual change from a single run. Compare it against the current reference on desktop, iPhone portrait, and iPhone landscape. Smoothness, readability, and continuity must improve on all three.

## Test environments

Use the local site unless testing a release candidate:

```text
http://127.0.0.1:8921/
```

Use a cache-busting query for fresh-load tests:

```text
http://127.0.0.1:8921/?qa=<date>-<pass>
```

Minimum matrix:

| Platform | Browser | Viewport or device | Required |
| --- | --- | --- | --- |
| Windows | Chromium/Chrome | 1440×900 or larger | Yes |
| Windows | Chromium/Chrome | 1280×720 | Yes |
| macOS | Safari | Current laptop viewport | Yes |
| iPhone | Safari | 390×844 portrait | Yes |
| iPhone | Safari | 844×390 landscape | Yes |
| Narrow phone | Safari or Chromium | 320×568 | Yes |
| Large phone | Safari or Chromium | 430×932 | Yes |
| Any supported platform | Reduced motion enabled | One portrait and one desktop size | Yes |

The Windows and Mac Codex sessions must not edit the same branch simultaneously. Use one editing session and make the other session read-only QA, or use separate branches and review the diff before merging.

## Four-pass protocol

For each critical journey:

1. Open a fresh cache-busted URL.
2. Complete the journey without developer shortcuts.
3. Record pass/fail and any timestamp or screenshot needed to reproduce a failure.
4. Close the tab and repeat three more times.

If one pass fails, the sequence is not considered stable. Fix or classify the issue, then restart the four-pass count from pass one.

## Critical journey A — first load and film

- [ ] The page begins at scroll position `0`.
- [ ] The opening stage fills the visible viewport immediately.
- [ ] There is no initial jump, reload-like flash, white frame, horizontal shift, or scrollbar flicker.
- [ ] The V appears once and remains optically centred.
- [ ] White-to-gold motion is continuous.
- [ ] The VICTORIOUS lettering resolves without duplicated or offset characters.
- [ ] The film starts muted and plays without a black stall.
- [ ] Resizing or rotating does not restart the intro unexpectedly.
- [ ] Returning from a background tab does not skip or snap the intro.

Record for each pass:

| Pass | Scroll Y | Stage top | Video error | Console error | Result |
| --- | ---: | ---: | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |

## Critical journey B — film to next drop

- [ ] The closing film V hands off to one gold DOM V.
- [ ] The gold V rises cleanly with no laser lines, starburst, vertical sweep, or unwanted glow explosion.
- [ ] The V never flashes white or black during the rise.
- [ ] The outgoing V is offscreen before the incoming VCTRS wordmark becomes visible; they must not read as a duplicate.
- [ ] The next-drop page enters smoothly and settles once.
- [ ] The real VCTRS wordmark is used.
- [ ] `POP-UP STORE` and `DETAILS DROPPING SOON` remain readable.
- [ ] Email and vault controls are visible and not clipped.

## Critical journey C — email

Test empty, malformed, and valid values.

- [ ] Invalid submission shows `CHECK THAT ADDRESS`.
- [ ] Focus returns to the email input.
- [ ] The input receives `aria-invalid="true"`.
- [ ] The result is connected with `aria-describedby="nextDropResult"`.
- [ ] Editing clears the error and removes `aria-invalid`.
- [ ] Valid submission shows `YOU'RE ON THE LIST`.
- [ ] A slow or failed network request does not block entry to the vault.
- [ ] No email address appears in console output or the URL.

Do not repeatedly submit real addresses during routine QA. Use an approved test address and confirm the external form endpoint separately when release testing requires it.

## Critical journey D — hold and vault transfer

- [ ] Pointer/touch hold visibly fills the control.
- [ ] Releasing an actual hold early drains the fill and cancels entry.
- [ ] Keyboard activation and assistive-technology click use the accessible automatic fill.
- [ ] Entry fires only once.
- [ ] Exactly one `.vault-entry-mark` exists during flight.
- [ ] The old drop copy fades before the photograph grid becomes visually busy.
- [ ] The background crossfade has no blank frame.
- [ ] VCTRS moves continuously into the vault target.
- [ ] There is no reparenting jump on the final frame.
- [ ] Exactly one `.vault-brand-live` exists after landing.
- [ ] Final wordmark colour is `rgb(240, 212, 146)`.
- [ ] `THE VAULT` appears beneath the wordmark.

## Critical journey E — vault and Surface

- [ ] Pointer and touch drag the archive naturally.
- [ ] Momentum stops without snapping beyond an edge.
- [ ] Arrow keys pan the archive.
- [ ] Focus starts on the vault region after arrival.
- [ ] Tab moves to `▲ Surface`.
- [ ] Tab from `▲ Surface` returns to the vault instead of a blank body stop.
- [ ] Shift+Tab from the vault returns to `▲ Surface`.
- [ ] Surface runs once and hides the vault.
- [ ] Focus moves to the visible opening stage after Surface.
- [ ] The page can scroll into the post-vault content.
- [ ] Touch scrolling remains enabled after Surface.

## Responsive checks

At every required viewport:

- [ ] No horizontal document overflow.
- [ ] The drop card remains within the viewport.
- [ ] The email row remains usable without browser zoom.
- [ ] The hold control is fully visible or reachable.
- [ ] Safe-area insets do not cover controls.
- [ ] VCTRS does not clip at either edge.
- [ ] The vault landing target remains centred.

For `844×390` landscape specifically:

- [ ] The compact short-height layout activates.
- [ ] The wordmark, title, email, and hold control fit without scrolling the source logo offscreen.
- [ ] The shared-element flight remains visible and continuous.

## Reduced-motion checks

Enable **Reduce Motion** at the operating-system level before opening the page.

- [ ] The opening does not run the added V choreography.
- [ ] The next-drop page does not slide or sweep.
- [ ] The VCTRS glyph does not pulse or shine indefinitely.
- [ ] The vault identity label and rule render immediately and remain visible.
- [ ] Essential content and controls are present without waiting for an animation event.
- [ ] Hold/activation remains operable.
- [ ] No state is left invisible because an animation was disabled.

### Apple checks

On macOS Safari and iPhone Safari:

- [ ] Test once with Reduce Motion off and four times with it on after any motion-related change.
- [ ] Test portrait and landscape orientation changes.
- [ ] Confirm the address-bar expansion/collapse does not reveal a black gap or move the hold control offscreen.
- [ ] Confirm the muted inline film does not open fullscreen.
- [ ] Background the browser during the intro, return, and confirm timing resumes without a snap.
- [ ] Lock and unlock the phone during the intro and vault, then confirm the page remains usable.

## Accessibility checks

- [ ] All interactive controls are reachable by keyboard.
- [ ] Every focusable item has a visible focus state.
- [ ] Focus never remains inside a hidden screen.
- [ ] Dialogs and overlays keep focus within their active controls.
- [ ] Form errors are announced and programmatically associated with the input.
- [ ] Images that are decorative have empty alternative text.
- [ ] Brand marks have an appropriate accessible name where meaningful.
- [ ] Text remains readable at 200% browser zoom.
- [ ] Colour is not the only indicator of validation or progress.

## Performance and stability checks

- [ ] No console errors or warnings across four runs.
- [ ] `film.mp4`, `vctrs-wordmark.svg`, poster, and all visible photographs load successfully.
- [ ] No animation creates duplicate DOM nodes after completion.
- [ ] No timer restarts a completed transition.
- [ ] Hidden content does not perform visible animation work under reduced motion.
- [ ] The first interaction remains responsive on a throttled or older phone.
- [ ] Test once with the browser cache disabled and a slower network profile.

Large asset extraction and vault-photo loading changes require their own comparison branch. They can improve startup performance, but they also change decode and animation timing and must not be mixed into an unrelated visual release.

## Automated DOM assertions

These assertions may be used by browser automation after the relevant state is reached:

```js
// Startup
console.assert(scrollY === 0);
console.assert(document.body.classList.contains('locked'));
console.assert(Math.round(document.querySelector('#stage').getBoundingClientRect().top) === 0);

// Next drop
console.assert(document.body.classList.contains('next-drop-landed'));
console.assert(document.querySelectorAll('.next-drop-mark .vctrs-glyph').length === 1);

// Vault landing
const live = document.querySelector('.vault-brand-live');
console.assert(document.body.classList.contains('next-vault-open'));
console.assert(document.querySelectorAll('.vault-entry-mark').length === 0);
console.assert(document.querySelectorAll('.vault-brand-live').length === 1);
console.assert(getComputedStyle(live).backgroundColor === 'rgb(240, 212, 146)');
console.assert(document.querySelector('.vault-brand-name').textContent.trim() === 'THE VAULT');
```

## Release record

Copy this block for each candidate:

```text
Candidate/commit:
Date:
Tester:
Desktop four-pass: PASS / FAIL
Mobile portrait four-pass: PASS / FAIL
Mobile landscape four-pass: PASS / FAIL
Safari four-pass: PASS / FAIL
Reduced motion: PASS / FAIL
Keyboard/accessibility: PASS / FAIL
Console/runtime: PASS / FAIL
Known issues:
Decision: APPROVE / HOLD
```

## Current deeper-review backlog

These are intentionally not part of a small-fix release:

- Extract embedded photographs/posters into cacheable files and defer hidden vault image decoding.
- Profile long-lived interval watchdogs for CPU and battery cost.
- Compare any major visual transition change against the current shared-element handoff on all required devices.

