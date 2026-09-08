# Video loading-circle local demo

Based on published `107ff39`; explicitly local-only pending user review. The rectangular shimmer/loading surface is replaced by a 28px gold ring. The loader is a sibling of the scaled video wrapper, keeping it circular through the existing depth motion. Its accessible status text remains available. The wrapper and its gradient remain transparent until playback; the original HD video and gradient then fade in over750ms. Buffering keeps the last frame with the ring; failure keeps the retry control; offscreen and reduced-motion behavior remain.

Run `node tools/serve-film-loading-demo.cjs` from the repository. Open http://127.0.0.1:8923/experience/?demo=loading-circle#portrait. This loopback-only server delays MP4 responses2.5seconds solely to demonstrate loading. Ordinary product loading has no added delay. Browser refresh still follows the approved reset-to-opening contract; open the link again to repeat the loading demonstration.

[Reveal checks](reveal.json) cover Chromium desktop/phone: circle28×28, transparent wrapper, no pending gradient/video, intermediate opacity about0.54, final opacity1 with real1280px video playing. [Lifecycle checks](lifecycle.json) cover WebKit desktop, Chromium phone and hard-failure retry, including offscreen pause/resume and no page errors. Root inspected desktop pending and phone ready screenshots. Navigation13/13, integration15/15, geometry/rebuild identity and media37/37 pass. No physical-device certification or publication.

Screenshots: [desktop loading](desktop-loading.png), [desktop ready](desktop-ready.png), [phone loading](phone-loading.png), [phone ready](phone-ready.png).

## Approved larger circle

The user approved publication after increasing the ring from28px to36px. All other reveal settings remain as reviewed. [Release browser checks](release-checks.json) pass held loading/reveal in WebKit desktop and Chromium phone, offscreen pause/resume and failed-load retry. Reduced-motion Chromium desktop/phone separately confirmed no spinner, hidden film and paused playback. Navigation13/13, integration15/15 and exact media37/37 pass. The2.5second delay exists only in the separate loopback demo-server tool, never in the published page.
