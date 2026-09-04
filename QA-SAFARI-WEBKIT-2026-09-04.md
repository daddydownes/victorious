# Safari/WebKit QA — 100-journey multi-agent sweep

Tested branch: `qa-small-wins-2026-09-03`  
Tested commit: `bb457b1a31aff992ffac106d6e17d418779fca63`  
Total canonical journeys: **100**  
Decision: **HOLD**

Three read-only QA agents ran 10 fresh cache-busted journeys for each Mac/iPhone viewport and motion preference below. External form submissions were intercepted; no test address left localhost.

## Matrix

| Environment | Motion | Result |
| --- | --- | ---: |
| Mac 1440×900 | Normal | 10/10 complete |
| Mac 1440×900 | Reduce Motion | **0/10 visible vault** |
| iPhone portrait 390×844 | Normal | 10/10 complete; tab-order defect 10/10 |
| iPhone portrait 390×844 | Reduce Motion | **0/10 visible vault** |
| iPhone landscape 844×390 | Normal | 10/10 complete; tab-order defect 10/10 |
| iPhone landscape 844×390 | Reduce Motion | **0/10 visible vault** |
| Narrow phone 320×568 | Normal | 10/10 complete |
| Narrow phone 320×568 | Reduce Motion | **0/10 visible vault** |
| Large phone 430×932 | Normal | 10/10 complete |
| Large phone 430×932 | Reduce Motion | **0/10 visible vault** |

Normal-motion core journeys completed **50/50**. Reduced Motion vault presentation failed **50/50**.

## Critical — Reduced Motion makes the entered vault invisible

Reproduced **50/50** across every tested Mac and iPhone viewport.

### Steps

1. Enable Reduce Motion before loading the page.
2. Open a fresh cache-busted URL.
3. Continue naturally to `POP-UP STORE / DETAILS DROPPING SOON`.
4. Activate `HOLD HERE TO ENTER THE VAULT` using pointer hold or its accessible automatic-fill path.
5. Attempt to use the vault and `▲ Surface`.

### Actual

The application reaches `next-vault-open`; no entry mark remains, exactly one live mark exists, the mark is `rgb(240, 212, 146)`, and `THE VAULT` exists in the DOM. However, `#vault` becomes `visibility: hidden` and `opacity: 0`. Focus falls away and `▲ Surface` is inaccessible. The opening V is visible instead of the archive.

### Expected

The vault, archive, identity, focus target, and Surface control should render immediately and remain usable when animation is disabled.

### Root cause and proposed fix

The reduced-motion branch of `flyIn()` makes the vault visible, then its `scrollTo()` triggers `updateScroll()`. `updateScroll()` recalculates visibility from scroll progress and overwrites the completed vault state. See `index.html:1884–1896` and `index.html:2022–2035` at the tested commit.

When `vaultActive && guidePhase === 'vault'`, keep opacity `1` and visibility `visible`, and bypass scroll-derived vault visibility. Retest all reduced-motion environments after the change.

## High — Vault Tab order enters the hidden Next Drop form

Reproduced **20/20** in motion-enabled iPhone portrait and landscape runs.

### Steps

1. Enter the visible vault normally.
2. Confirm focus begins on `#vault`.
3. Press Tab once.

### Actual

Focus moves to hidden `#nextDropEmailInput`, not `#surfaceBtn`. `aria-hidden=true` on Next Drop does not remove its descendants from sequential focus.

### Expected

The first Tab from the vault should move to `▲ Surface`; hidden-screen controls should not be focusable.

### Proposed fix

Set the hidden Next Drop subtree inert after vault entry, with a fallback that disables or temporarily assigns `tabindex=-1` to its controls. Restore it only when intentionally returning to that screen. Also explicitly move forward Tab from `#vault` to `#surfaceBtn`, mirroring the existing reverse-cycle behavior.

Mac headless WebKit showed a similar mismatch, but real Mac Safari should be reconfirmed with Full Keyboard Access enabled.

## Observation requiring targeted follow-up

Early release correctly cancelled entry in all 40 core-iPhone runs. A stale visual `full` class appeared in 2/40 runs across different configurations. This was not reproducible enough to classify as a release blocker.

## Stable findings

- No horizontal overflow or clipped Next Drop/hold controls at any tested viewport.
- Startup position and visible stage height were correct.
- Muted inline film behavior was stable in this sweep.
- Empty/malformed email handling, focus return, `aria-invalid`, `aria-describedby`, editing reset, and valid-state copy passed.
- Completed holds created one live mark, zero entry marks, and the correct gold colour.
- Normal-motion Surface restored stage focus and touch action.
- No unexpected console, page, same-origin HTTP, or asset failures were reported.

## Scope limitation

This sweep used Playwright WebKit with Safari/iPhone rendering, viewport, touch, and motion-preference emulation. Physical-device checks remain required for address-bar changes, live rotation, lock/unlock, background/foreground lifecycle, hardware safe areas, true multi-touch, thermal pressure, and native fullscreen-media behavior.
