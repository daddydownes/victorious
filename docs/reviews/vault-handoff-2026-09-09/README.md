# Faster vault identity handoff

Baseline09349a60fc76cdc108071e08c3d458197e87f4db. Preserve the travelling identity path and artwork; shorten its flight1650→1250ms, post-landing hold1800→420ms and fade500→220ms. Image readiness plus the start of the cosmetic fade unlock interaction. A separate completed-title promise still represents actual animation completion. Reduced motion has no deliberate title hold.

Measured full-entry baseline:4083ms click-to-interactive, including2183ms after observed landing. Eight final full journeys (four Chromium phone and four WebKit phone) measured1794–1937ms click-to-interactive with the identity still visible as its exit begins. Each continued through Surface and preview, checking current media and unchanged opening. Timing is local evidence, not a network-independent guarantee.

Native Chromium touch: a rapid swipe during entry stayed locked; a fresh swipe during the title fade moved the real native archive. Both engines retained decoded previews after an8-second blocked-archive fallback, with no stuck gate. Four reduced-motion cases per engine passed. Original-source/reveal/press/Surface suites pass. Independent review is recorded separately.

Limits: Windows browser engines and emulated phones; no physical iPhone/macOS Safari certification. No evidence attributes the prior issue to Google systems. Real slow downloads still retain the existing bounded image-readiness gate. Signup transport intercepted; no inbox test.
