# VCTRS responsive and reduced-motion fix verification

Checked 2026-09-08 (Australia/Sydney).

## Versions

- Live before: `https://vctrsclo.com/`, GitHub Pages/current GitHub `46226be139353d81947499ec5552c52547d68011`.
- Local after: `http://127.0.0.1:8921/`, root fix commit `539470e` on the shared candidate.
- Route: `/` only. Flappy V and story ownership remained with other agents.

## Confirmed live defects and local results

### 1. Short landscape invitation blocks entrance (high)

On live, after the invitation lands (`body.next-drop-landed`), the fixed, hidden-overflow viewport cannot expose the entrance button:

| Engine / viewport | Live email visible | Live entrance visible | Local email visible | Local entrance visible | Local touch result |
|---|---:|---:|---:|---:|---|
| Chromium 480x320 | 0 px | 0 px | 42 px | 59.39 px | landed in Vault |
| Chromium 540x360 | 10.66 px | 0 px | 42 px | 59.39 px | landed in Vault |
| WebKit 540x360 | 10.66 px | 0 px | 42 px | 59.39 px | landed in Vault |
| Chromium 568x320 | 42 px | 63.02 of 67.39 px | 42 px | 59.39 px | landed in Vault |
| WebKit 844x390 | 42 px | 67.39 px | 42 px | 59.39 px | landed in Vault |

Live 480x320 and 540x360 had no usable vertical scroll (`scrollHeight == viewport height`, body overflow hidden). Local has no horizontal overflow and preserves an overflow-y fallback on the overlay. All five local checks used Playwright touchscreen taps and reached `__guide.phase() === "vault"`.

Live screenshots:

- `/private/tmp/vctrs-responsive-redo/live-before-46226be/chromium-480x320-invitation.png`
- `/private/tmp/vctrs-responsive-redo/live-before-46226be/chromium-540x360-invitation.png`
- `/private/tmp/vctrs-responsive-redo/live-before-46226be/webkit-540x360-invitation.png`
- `/private/tmp/vctrs-responsive-redo/live-before-46226be/chromium-568x320-invitation.png`
- `/private/tmp/vctrs-responsive-redo/live-before-46226be/webkit-844x390-invitation.png`

Local screenshots use the same filenames under `/private/tmp/vctrs-responsive-redo/local-after-candidate/`.

### 2. Reduced-motion focus enters covered legacy controls (accessibility, confirmed keyboard behavior)

Live at 320x568 with `prefers-reduced-motion: reduce`, repeated Tab moved focus behind the landed invitation:

- Chromium: `#nextDropEmailInput` -> visible Join -> `#nextVaultHold` -> hidden `#signupEmail` -> hidden legacy submit -> hidden `#vaultHold`.
- WebKit: `#nextDropEmailInput` -> hidden `#signupEmail`.

For the hidden targets, `:focus-visible` was true while `elementFromPoint()` at the target centre returned the covering invitation. This confirms keyboard focus leakage. It does not establish how a specific screen reader announces the page.

Local cycles only through invitation controls/body. No covered legacy target received focus in Chromium or WebKit.

Live screenshots:

- `/private/tmp/vctrs-responsive-redo/live-before-46226be/chromium-320x568-reduced-focus-hidden-signup-focus.png`
- `/private/tmp/vctrs-responsive-redo/live-before-46226be/webkit-320x568-reduced-focus-hidden-signup-focus.png`

### 3. Reduced-motion Vault blocks pinch zoom (confirmed synthetic gesture)

Live Chromium mobile emulation at 390x844:

- normal motion: computed `touch-action: auto`, native-pan state active, CDP pinch changed `visualViewport.scale` from 1 to about 2;
- reduced motion: computed `touch-action: none`, native-pan state inactive, the same pinch left scale at 1.

Local reduced motion computes `touch-action: pinch-zoom`; the same gesture changed scale from 1 to about 2. Normal motion still reaches about 2.

Evidence: `/private/tmp/vctrs-responsive-redo/live-before-46226be/pinch-results.json` and `/private/tmp/vctrs-responsive-redo/local-after-candidate/pinch-results.json`.

This is an actual Chromium compositor gesture through CDP, but still browser emulation rather than a physical two-finger device test.

## Visual and asset fidelity

The normal-size 390x844 and 1280x720 invitation geometry matches live exactly, field by field. The 1280x720 invitation screenshot is byte-identical (`cc880f7c...`). Manual comparison of all normal invitation/Vault screenshots found no visual downgrade. The Vault state reports the same Surface geometry, interaction state, and the same 17 image filenames and natural dimensions on live and local. Both runs had zero console errors and zero failed requests. Commit `539470e` changes only `index.html` and `tools/build-experience.cjs`; no image or video assets changed.

Live normal-size evidence: `/private/tmp/vctrs-responsive-redo/live-quality-46226be/`.

Local normal-size evidence: `/private/tmp/vctrs-responsive-redo/local-quality-candidate/`.

## Raw results and limits

- Live critical JSON: `/private/tmp/vctrs-responsive-redo/live-before-46226be/results.json`
- Local critical JSON: `/private/tmp/vctrs-responsive-redo/local-after-candidate/results.json`
- Live quality JSON: `/private/tmp/vctrs-responsive-redo/live-quality-46226be/results.json`
- Local quality JSON: `/private/tmp/vctrs-responsive-redo/local-quality-candidate/results.json`

All tests are headless Chromium/WebKit viewport, keyboard, and touch emulation. They do not cover physical browser chrome/safe areas, a physical multi-touch screen, or an assistive-technology browse session.

## Final integrated release run

Frozen candidate `8058f9b7f56d1dff6d788d6a80660633c1dfed99` was served at port 8921 with root and story bytes verified against the worktree before the run.

- WebKit 390x844: 4 of 4 consecutive natural full journeys passed.
- WebKit 844x390: 4 of 4 consecutive natural full journeys passed.
- Total: 8 of 8. No failed or restarted sequence, page error, missing request, or external request.
- Each journey used the opening scroll input, invitation entrance, Vault and Surface controls, one observed native story-film loop, Flappy open/death/retry/exit, Vault return, Back/Forward restoration, Surface again, and Start again. The harness did not seek media, dispatch media events, mutate game state, or jump routes.
- Final Chromium reduced-motion pinch check at 390x844 passed: normal and reduced modes both changed `visualViewport.scale` from 1 to about 2; reduced mode computed `touch-action: pinch-zoom`.

Evidence:

- `/private/tmp/vctrs-responsive-redo/final-integrated-8058f9b/results.json`
- `/private/tmp/vctrs-responsive-redo/final-integrated-8058f9b/pinch-results.json`
- `/private/tmp/vctrs-responsive-redo/final-integrated-8058f9b/webkit-390x844-pass1-film-loop.png`
- `/private/tmp/vctrs-responsive-redo/final-integrated-8058f9b/webkit-844x390-pass1-film-loop.png`

The run used headless WebKit viewport/touch emulation and a synthetic Chromium compositor pinch. It was not a physical-device or physical multi-touch test.
