# Gold touch button candidate

Preview branch only, not deployed. Serve the repository and open `/demos/button-press-feedback/`; open `/` for the full site. The preview offers normal/slow motion and the previous study for comparison. Rebuild it from the candidate CSS and button markup using `python3 demos/button-press-feedback/build.py` after edits.

## Current treatment

The pressed gold face is a continuous surface with no inset rim or inner rectangle. Soft edge-to-edge gold shading and a localized light at the point of contact provide feedback; dark lettering remains crisp. Release expands that light across the face in 280ms, before the existing outgoing card starts fading. Keyboard activation resets the light to the centre. The label uses only a 1px vertical press displacement, never scale or opacity. Reduced motion disables the moving light and displacement, leaving static pressure feedback.

Idle lighting retains its shared 5.4-second clock and two button sweeps per logo cycle. No new assets or network requests are required in production. A decorative aria-hidden span and a small origin-setting helper are the only production markup/JS additions; the existing activation guards and vault choreography remain intact.

## Why disappearance is handled this way

The original outgoing card fades from about 297–726ms into the 1650ms vault transfer. The feedback completes before that fade, so the accepted press is visible before the intentional scene transition. The standalone demo keeps the button present for replay; it does not reproduce the parent card fade.

## Validation

- `node tests/reveal.cjs`: passes normal/reduced cases four times and script syntax.
- `node tests/post-surface-scroll.cjs`: passes, including desktop retune and touch fixtures.
- `node tests/press-feedback.cjs`: actual handler extraction passes four times: off-centre origin, bounds, keyboard centering, mouse/touch entry, swipe cancellation, pointer cancel and multi-contact rejection.
- Desktop Chrome preview inspected at left-side press in slow motion; label remains readable and light comes from the contact point.
- 375px phone emulation preview fits the button and shows confirmation. No console messages observed in this preview.
- The prior CSS-only study completed a full natural-intro desktop vault journey. The new contact-light candidate also completed a full phone-sized Chrome intro → press → visible vault journey.
- Four-pass full browser/device release matrix and physical Safari remain outstanding. This is a reviewable design candidate, not a production release.
