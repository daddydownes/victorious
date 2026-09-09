# Preview opens game; gentle end feedback

Baseline7df8f2819b564f1df9813940529e8cb52cf14af0. The preview surface is a native Play button covering the card; it opens the full game instead of injecting a preview flap. It remains usable while the preview iframe is unavailable and with reduced motion. The visible Take control action remains. Vertical swipes retain native scrolling.

At the actual bottom, outward scrolling triggers one16px,520ms settle animation on visible game-section children. The section's snap/layout box stays fixed. Further input does not stack the animation; reverse scroll, game entry, resize and hidden/reduced-motion changes cancel it. Reduced motion is still.

Twelve repeated browser journeys pass: four each Chromium phone, WebKit phone and reduced-motion Chromium. Preview taps and Enter/Space open full game, run/Exit and focus return work; wheel bounce completes, bottom scrollTop stays invariant and reverse scrolling works. A separate native Chromium touch gesture moved scrollTop844→469 before the existing section snap returned to844; it did not launch the game. A suppressed iframe-ready message did not block Play. Source/reveal/Surface and106game-lifecycle cases pass. Independent review passed.

Regression: moving the snap section itself initially shifted its scroll position and cancelled the bounce after about50ms. failure.json records detection; the final browser checks observe animation during the cue, full settlement and unchanged bottom position. Animate direct visible children instead. This is a provisional lesson, not a validated memory change.

Limits: Windows browser engines and emulated phones; no physical Safari or assistive-technology certification. Signup requests intercepted. Fixed16px cue preserves native normal scrolling; existing sectional snap can return a short swipe to its prior section.
