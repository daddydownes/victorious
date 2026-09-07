# VCTRS — Demo 02 complete handoff

> Imported on 8 September 2026 from the separate `vctrs-motion-concepts` archive as the behavior reference for the local V-style demo. Machine-specific filesystem paths were removed. Relative artifact links below are provenance labels from that source archive; the production implementation is owned by this repository's source and generated-output workflow.

Date: 8 September 2026 (Australia/Sydney)

## Outcome

Four Astra agents explored four visual concepts. The user selected **02 — Game and vault motion**, then requested **four Sol agents** to refine it into a polished **demo only**, with most attention on **the game showing up**.

The refined demo is complete and was opened in Google Chrome on the user's computer. All 13 final Chromium browser checks passed. The live website and production source were not modified or deployed.

## User direction

- Build on what vctrsclo.com already is; preserve its identity, artwork, content, and layout.
- Explore feel, scrolling, and creative animation using existing elements.
- Explore spray-paint lettering for the game and Back to the Vault.
- Produce one visual from each of the four initial Astra agents.
- Refine concept 02 with four Sol agents.
- Keep the result a demo; prioritize the game appearing over secondary vault effects.

## Open the finished demo

**Original archive preview route:** `02-polished/` on the source archive's local server.

This address works on this computer while the local server is running. It is not a public deployment.

1. Scroll to the game card and watch its entrance.
2. Select the card or painted arrow to expand the automatic game preview.
3. Select **Exit preview** or press **Escape** to return to the same card and scroll position.
4. Select **Replay motion** to repeat the card arrival.
5. The vault button demonstrates a response without navigating.

The full-screen game is explicitly labelled **AUTOMATIC DEMONSTRATION · NOT PLAYABLE**. This is an animation preview, not a new playable-game implementation.

To restart the preview server if needed:

```sh
python3 -m http.server 8942 --bind 127.0.0.1 --directory <path-to-vctrs-motion-concepts>
```

Open the preview URL in Chrome after the server starts. If that port is already serving the demo, reuse it.

## All four initial Astra visuals

| Agent focus | Visual |
| --- | --- |
| Scroll feel | [Scroll feel study](scroll-feel/index.html) |
| Game and vault transitions — selected 02 | [Original demo 02](game-vault-motion/index.html) |
| Spray artwork | [Spray-paint comparison image](spray-lettering-white-comparison.png) |
| Motion review and reduced-motion comparison | [The settled mark](motion-review/index.html) |

The generated spray comparison is a static white-on-black concept board, not a transparent production asset. It was not substituted into demo 02. Demo 02 retains the original gold spray artwork.

## Four Sol agents and their contributions

| Agent | Responsibility | Delivered work |
| --- | --- | --- |
| sol_motion_build | Motion implementation | Scroll-triggered arrival, card-bound fullscreen reveal and return, cancellation, focus, reduced motion, preview lifecycle |
| sol_visual_polish | Visual and responsive styling | Game-focused composition, original rounded card and gold vault capsule, phone and short-landscape sizing, visible focus |
| sol_demo_qa | Browser verification | Reproducible Chromium harness, 13 passing checks, screenshots and results |
| sol_demo_review | Independent review | Source-level motion/accessibility review, original asset integrity, clear demo-only wording |

The main agent coordinated ownership, integrated the HTML and concise copy, reserved intrinsic image dimensions, inspected screenshots, requested corrections, and opened the final demo in Chrome.

## Final behavior

### Game arrival

- Uses native scrolling; the demo does not intercept wheel or touch scrolling.
- Starts one bounded arrival when the card enters the observer region and artwork has decoded.
- Card rises from 38 px with a small scale and brightness settle over 980 ms, after a 90 ms delay.
- The original Play the Game heading stays fully painted and stationary, with only restrained brightness variation.
- The arrow settles once rather than looping continuously.
- Reverse scrolling does not repeatedly erase or replay the completed arrival. Replay is an explicit demo control.

### Fullscreen entry and return

- A 560 ms clip reveal opens from the card's screen rectangle into the full-screen game view without stretching the canvas.
- Return takes 430 ms and restores the actual opener and scroll position.
- Early Escape samples the current animation frame before reversing, preventing a jump to fullscreen.
- Repeated entry/exit is guarded; old animations cannot replace newer modal state.
- Resize during a transition settles it safely instead of keeping outdated bounds.

### Accessibility and lifecycle

- Both header and main content are inert while the dialog is open.
- Focus enters Exit, stays inside the dialog, and returns to the card or arrow that opened it.
- Reduced-motion changes settle active transitions; automatic preview motion pauses.
- Hidden-page handling stops preview activity.
- Only the relevant inline or expanded preview is requested to run.
- Artwork dimensions are reserved to reduce image-loading layout shifts.

### Secondary vault response

- Preserves the original Back to the Vault spray artwork and gold capsule control.
- Provides a restrained one-time artwork/arrow arrival and a labelled response mockup.
- Does not navigate or modify the real vault experience.

## Important corrections made during refinement

- Replaced mismatched scaled fullscreen geometry with an exact card-bound clip reveal.
- Fixed an early-Exit visual jump by reversing from the current frame.
- Normalized the completed fullscreen clip before returning so the close remains animatable.
- Gated first arrival on image decoding.
- Kept the heading fully painted and stationary.
- Restored the original rounded card and gold capsule after rejecting unrelated frame/control redesign.
- Corrected rotated artwork overflow on narrow screens.

## Final verification

Final evidence timestamp: **2026-09-07 15:24:52 UTC**, corresponding to **8 September 2026, 01:24:52 Australia/Sydney**.

| Check | Result |
| --- | --- |
| embedded preview canvas is actively rendering on arrival | PASS |
| entry opens dialog and moves focus to Exit | PASS |
| expanded preview canvas is active after entry | PASS |
| early Escape closes and restores cue focus | PASS |
| true early Escape reverses from sampled in-flight geometry | PASS |
| repeated card entry/Escape restores card opener | PASS |
| dialog traps keyboard focus | PASS |
| opening and closing preserves native scroll position | PASS |
| switching reduced motion mid-flight settles active entry animation | PASS |
| 390px viewport has no horizontal overflow | PASS |
| dialog controls fit within narrow viewport | PASS |
| 844×390 dialog controls remain onscreen | PASS |
| 540×360 dialog controls fit viewport | PASS |

Additional validation: JavaScript syntax passed; original spray PNGs and automatic game-preview HTML were verified unchanged. Screenshots were reviewed for desktop and emulated mobile layouts. The final page was visibly opened in native Chrome.

**Limits:** These are Chromium desktop and emulated-viewport checks, not physical-phone testing or a Safari/Firefox certification. No measured universal frame-rate guarantee is claimed. The review document contains proposed acceptance criteria as well as findings; the final results JSON is the authoritative list of automated checks actually run.

## Files and evidence

| Item | Location |
| --- | --- |
| Final demo HTML | [02-polished/index.html](02-polished/index.html) |
| Styling | [02-polished/styles.css](02-polished/styles.css) |
| Motion | [02-polished/motion.js](02-polished/motion.js) |
| Demo readme | [02-polished/README.md](02-polished/README.md) |
| QA harness | [02-qa/audit.cjs](02-qa/audit.cjs) |
| QA instructions | [02-qa/README.md](02-qa/README.md) |
| Final test results | [02-qa/evidence/results.json](02-qa/evidence/results.json) |
| Independent review | [02-review.md](02-review.md) |
| Spray concept prompt | [spray-lettering-prompt.txt](spray-lettering-prompt.txt) |

### Visual evidence

- [Desktop arrival](02-qa/evidence/desktop-1440x900-arrival.png)
- [Entry midflight](02-qa/evidence/desktop-1440x900-entry-midflight.png)
- [Desktop fullscreen](02-qa/evidence/desktop-1440x900-dialog.png)
- [Before early Escape](02-qa/evidence/desktop-1440x900-early-before-escape.png)
- [After early Escape](02-qa/evidence/desktop-1440x900-early-after-escape.png)
- [390×844 mobile composition](02-qa/evidence/mobile-390x844-full.png)
- [390×844 mobile fullscreen](02-qa/evidence/mobile-390x844-dialog.png)
- [844×390 short landscape](02-qa/evidence/short-844x390-dialog.png)
- [540×360 compact landscape](02-qa/evidence/compact-540x360-dialog.png)

## Production boundary and next step

All original deliverables are isolated in the separate `vctrs-motion-concepts/` source archive. No production commit, push, or deployment was made for that work.

The next step is user review of the game appearance in the demo. Integrating it into the live site's real playable game would be separate work and would need to preserve the production game's existing lifecycle, navigation, physics, reward, and input behavior. Do not treat this demo or earlier historical deployment notes as authorization to publish.
