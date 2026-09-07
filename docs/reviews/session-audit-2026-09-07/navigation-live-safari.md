# VCTRS desktop navigation audit — 2026-09-07

Baseline: live `https://vctrsclo.com/` and `https://vctrsclo.com/experience/`, verified by the GitHub-state specialist as byte-identical to GitHub Pages build `46226be139353d81947499ec5552c52547d68011`.

Environment: native Safari desktop, visible live UI, accessibility-tree inspection and screenshots through Computer Use. No email was submitted, no purchase/payment path exists, and no external state was written.

## Finding

### Medium — false signup receipt exposed in the accessibility tree before signup

- Reproduced on a fresh root load during the opening and again on the next-drop screen.
- Safari AX exposed the text `RECEIVED. THE VAULT HAS IT.` even though it was visually hidden and no signup had occurred.
- Source: root `index.html`, `#seamRcv` is pre-populated, has `aria-live="polite"`, and is hidden only with `opacity:0`.
- The `.signed` receipt nodes use `display:none` until success and did not appear in the pre-success AX tree.
- Evidence limit: this proves premature AX discoverability; it does not prove that a particular screen reader automatically announces initial live-region text.
- Suggested repair: leave the live region empty until success, or synchronize `hidden`/`aria-hidden` with the real receipt lifecycle.

### Low — permissive root email predicate accepts malformed domains (source-confirmed)

- Root `goodEmail()` accepts `a@b..com`: `/^[^@\s]+@[^@\s]+\.[^@\s.]+$/`.
- A live click was deliberately not attempted because it could send to FormSubmit.
- Empty and `not-an-email` values were tested live and correctly showed `CHECK THAT ADDRESS`, returned focus to the input, and cleared the error while editing.

## Passing journeys observed

- Root opening reached the next-drop screen with visible email and `PRESS HERE / ENTER THE VAULT` controls.
- Safari Option-Tab plus Space entered the vault. Focus landed on the vault region.
- Right Arrow panned the archive. A pointer drag moved the archive and settled without a visible snap.
- Focus wrapped vault → Surface → vault and Shift-Option-Tab returned to Surface.
- Space on Surface navigated to `/experience/`.
- Back restored the root URL with `#vault` and focus on the vault; Forward restored `/experience/`.
- Story Skip link was visible on focus and reached `#portrait`; the visible Scroll control focused the story heading after activation.
- Story film left its loading state and played.
- Both story Play controls opened the fullscreen game dialog; focus stayed within canvas / Start / Exit, Escape restored the correct triggering control. Game mechanics were excluded from this audit.
- Enter the vault navigated to `/#vault`; Back restored the story's prior scroll position and CTA focus.
- Start again navigated to a clean root URL and restarted the opening; Back restored the story ending position.
- Story footer empty and malformed email values were blocked by Safari native validation with focus on the email field.

## Constraints

- Screenshots were visually inspected and emitted in the Computer Use transcript at the opening, next drop, vault, story opening/film, game invitation/dialog, Back to the vault, ending, and both validation states. The Computer Use runtime did not expose a documented filesystem export, so no standalone PNG path was created.
- Live form transport, successful signup states, reduced-motion mode, zoom extremes, physical devices, and other browser engines were not exercised here.
