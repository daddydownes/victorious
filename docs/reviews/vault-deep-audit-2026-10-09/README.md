# Vault entry: twenty independent code audits

Baseline: published `52c2ae56028554f5286d1269c0cb8d9aa174e92e`. Runtime correction: `1942e178c4e35bb62e93027c520d4f6c06ea2bfc`. The owner requested fifteen deep code audits, then five broader audits, after earlier releases did not resolve physical Safari feedback. All twenty completed; implementation was coordinated afterward rather than twenty agents editing the same controller.

## Confirmed problems and corrections

1. **A new contact did not stop the previous completion.** A baseline reproduction released an 80px stroke, waited five frames, then held a new finger stationary for 100ms: the camera advanced another 186.55px. Four pixels of backward movement still allowed another 116.31px forward. Touchstart now immediately pauses the displayed position. A tap resumes the retained destination; dragging takes over that same position. Cancellation also retires or resumes every paused owner; an independent review caught that cancellation regression before publication.
2. **Released partial zooms used stale geometry.** The real layout mixes stable `svh` sections with a dynamic `dvh` panel. A height change altered the destination without rebasing the animation's starting position. One comparison should progress to `.4026` but instead reached `.4372` on the same frame. Released and paused camera moves now rebase their start/current position proportionally, retaining the easing clock. Root height-only measurement records the native height without recentering the photo plane or measuring retired chapters; camera framing retains its captured height. Real width changes remain measured.
3. **The scene was prepared on its first visible frame and repeatedly dismantled around that boundary.** Image decoding did not pre-create its visible layer state. Preparation changed visibility, brightness, promotion and positioning of the 33-photo scene; retreating across the boundary hid it and flushed image upgrades. Preparation now begins under the covered collection/signup approach and persists through ordinary boundary reversals. Actual chapter exit still cancels it.
4. **Entry combined native-scroll creation with layer cleanup and redundant layout.** The native handoff still establishes required scroll geometry, but transform promotion is retained through the existing 700ms settlement. Entered controller cleanup returns before hidden-panel geometry reads, and the exact guide endpoint is painted before the click. The periodic document-height poll also skips the prepared camera.
5. **Input delivery time could distort swipe speed.** Recent samples now use validated event timestamps, discard idle seeds and reject unreliable timing. The approach no longer immediately reads `scrollTop` after each authored write; continuous anchors retain the existing native-deviation tolerance.
6. **Some unrelated rendering work was avoidable.** The poster's 16px backdrop blur was redundant over its black backing and is removed; its gradient, border, shadow and content remain. Each fully offscreen chapter's decorative effects pause independently; the signup landing is targeted without freezing the visible Vault descendant. No photo filter, shadow, source, quality or arrangement is removed.

## Audit coverage

| Audit | Focus | Main result |
| --- | --- | --- |
| 1 | Touch event dispatch | Stationary second-contact drift; timestamp delivery weakness |
| 2 | Scroll ownership | Confirmed paused-contact mismatch; conditional native-takeover snap |
| 3 | Photo transforms and raster | Large decorated scene; no proof of per-frame rerasterization |
| 4 | Safari toolbar/viewport | Released geometry jump and root recentering |
| 5 | Style work | First-reveal preparation and boundary teardown |
| 6 | Native handoff | Position continuity is correct; endpoint rebuild cost remains |
| 7 | Motion sampling | Reproduced contact drift and unreliable velocity clocks |
| 8 | Background clocks | Hidden media/game loops ruled out; legacy measurement remains |
| 9 | Browser/native scrolling | Custom input pipeline is main-thread dependent; retain uncancelable guard |
| 10 | Change history | Idle velocity seed and native-to-scripted historical change |
| 11 | Test blindspots | Position checks do not measure rendered smoothness; driver cadence limitation |
| 12 | Quantization | Decimal rounding ruled out; input frequency limits held updates |
| 13 | Reveal edge | Scene creation/teardown occurs at strict reveal boundary |
| 14 | Recovery | Released animation bounds need rebasing; no ordinary observer reset loop |
| 15 | Independent system review | Main-thread pipeline remains; caught paused cancellation regression |
| 16 | Photo delivery/memory | Derivatives used; decoded-pixel cost and initial swaps remain possible work |
| 17 | Decorative rendering | Redundant backdrop blur and hidden collection effects |
| 18 | Media/async work | No persistent hidden media loop; initial deliveries/countdown still run |
| 19 | Observers/layout | Successful entry caused needless hidden-panel measurements |
| 20 | DOM/platform structure | Mixed viewport units and duplicate geometry owners; no fixed-ancestor trap |

## Verification and limits

Focused controller checks pass 24 held paths, 20 release paths, immediate new-contact/subslop/tap/cancellation cases, timestamp batches/idle seeds, 540 unchanged wheel frames, 540 continuity frames, and 27 settling cases. The new toolbar check passes 30 cases with 334 normalized frame comparisons at 60/120Hz using stable-section/dynamic-panel geometry. Camera checks execute the real functions and guide render: twelve reveal-edge reversals retain preparation, height-only changes retain the transform, width changes still measure, and native layer retention covers 699/700ms. Prior code fails the relevant pause/toolbar/layer regressions. Delivery/handoff, source, build and whitespace checks pass. Full journey/game matrices were not repeated.

Two focused Chromium 390×844/DPR3 browser phases used predecoded photos and mocked signup. Computed `#dive` transform and native scroll remained identical during a new 180ms hold and a 3px subthreshold movement; release resumed the overview or entered the Vault exactly once. No page errors. Overview and landed renders were inspected. Tested runtime root SHA-256: `ddea7739df26eaf2f4b62d39d978fea6d673e8aaef92855aca6afe455f93ed02`. Subsequent source-comment corrections change the root hash to `2a5d087580c4a4464e6f8c338495e2aeb25d40e204784cc43e99a2448d34c6bb` without changing executable code or CSS declarations.

A separate baseline timeline found touch-handler work at most 0.3ms, camera JavaScript at most 0.1ms, and no RAF gaps above 25ms in that desktop run. Its driver waits for CDP acknowledgements and therefore delivered approximately 30Hz input to a 60Hz display clock. This exposes a test-fixture limitation; it is not evidence of the physical iPhone's cadence. Mathematical input following and fast JavaScript cannot prove smooth GPU presentation. WebKit phone-size wheel tests likewise do not emulate actual iPhone touch ownership.

The custom approach/zoom remains dependent on delivered touch events and the main thread. Native scroll surface construction, initial photo presentation and decorated photo rendering still have costs. This release removes identified discontinuities and scene churn; physical iPhone Safari frame smoothness remains unverified. Do not present agent consensus, passing functional checks or desktop timing as a zero-lag guarantee. A native approach or different photo rendering design would require separate, deliberate validation rather than another blind rollback.

Platform cross-checks used primary sources: [Pointer Events gesture intersection](https://www.w3.org/TR/pointerevents/latest/), [WebKit backdrop-filter rendering](https://webkit.org/blog/3632/introducing-backdrop-filters/), [dynamic viewport units](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), [WebKit layers and memory](https://webkit.org/web-inspector/layers-tab/), and [WebKit cancelability discussion](https://bugs.webkit.org/show_bug.cgi?id=141456). These support platform behavior, not a diagnosis of this owner's hardware.
