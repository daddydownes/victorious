# Original opening restored; automatic Surface loading

Based on903188d6d5470b693f11f0c23dc3ec0a68b936c5. The opening before email was still using the demo720×406,673kbps copy. It now references the existing original1920×1080 asset, matching the original pre-guided source and unchanged3.733-second cut. No media recompression.

The source guard now compares the opening video resource to pre-guided production; it failed before correction and passes after. Eight full opening → Vault readiness → Surface → preview journeys pass (four Chromium and four WebKit phone emulations), recording actual opening playback dimensions and resource. Both engines pass a13.2-second HTTP-held media response followed by automatic recovery; no loading skip button is shown. Eight reduced-motion checks pass. Relevant source/reveal/press/Surface suites and independent review pass.

Surface retains a gently pulsing V while waiting; normal reveal still waits for a presented frame and navigation for the completed entrance. Actual errors or autoplay restrictions retain recovery controls. This supersedes the former12-second Continue without film decision.

Limits: Windows engines/emulated phones, no physical iPhone/macOS Safari. WebKit may downscale reported playback dimensions while requesting the native1080p source. Signup transport intercepted; no inbox test. Existing opening slow-load fail-open timing is unchanged.
