# Approved comic lettering release
Baseline: 7ef67dffd0003f676211e1840e6af2481c226a70.
The custom solid-gold comic artwork replaces the game heading. The glow and shine run only while the preview is visible, stop in gameplay/background, and remain static with reduced motion. The original art is retained. `node tools/build-play-lettering.cjs` rebuilds the self-contained vector asset.

Validation: 76 successful full journeys, four for each of 19 configurations. Chromium: 1440x900, 320x568, 360x800, 390x844, 412x915, 430x932, 844x390, and reduced-motion 768x1024. WebKit: 1440x900, 375x667, 390x844, 430x932, 844x390, 1024x1366, and reduced-motion 390x844/844x390. Firefox: 1440x900, 390x844, and reduced-motion 390x844.

Each journey loads all 32 photos, enters Vault and Surface, opens and exits the game twice, returns to Vault and refreshes. Keyboard entry and resize/rotation are included. No page errors or failed HTTP responses in the successful matrix. Phone/landscape WebKit screenshots were inspected.

All 12 documented source/behavior suites passed. Chromium and WebKit mocked signup validation/success/failure/timeout passed (eight checks), plus runtime reduced-motion switching and missing-art fallback (four checks). No real signup requests were sent. The exact restoration audit confirms only heading artwork, its CSS and lifecycle changed; latest signup copy and typography are preserved.

Host limitations: Windows sandbox restrictions prevented WebKit video decoding and Firefox page creation. Identical WebKit video played outside the sandbox, and the complete WebKit/Firefox matrices passed there. Firefox used a compatible isolated test driver. These are desktop-browser emulations, including WebKit; physical iPhone, iPad, Android and macOS Safari were not tested. No claim covers every phone model.
