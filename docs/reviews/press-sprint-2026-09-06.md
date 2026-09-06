# Frameless press sprint — September 6, 2026

Candidate source: `2fa42e5`, with subsequent demo-only assistive-click parity correction. This is preview QA, not a production release or a complete physical-device certification.

## Design and review

Two parallel agents handled the frameless CSS and independent input review; the primary agent integrated, corrected assistive-click centering, rebuilt the preview and operated Chrome. Removed the inset border and pressed inset shadows. Gold illumination now covers one continuous face. Held and release bloom use matching scale/opacity. Contact-origin light, unscaled dark lettering, idle timing and reduced motion are preserved.

## Browser observation

One natural intro → press → vault journey in each of four Chrome environments: desktop 1440×594, emulated phone 375×667, emulated landscape 667×375, and reduced-motion landscape 667×375. These are four total journeys, not four consecutive journeys per environment.

All four: button fits viewport, no recorded runtime errors, final vault visible at opacity1, focus on vault, one live brand mark and zero transfer marks. Normal-motion samples show zero inner border and button remains above98% effective opacity during the280ms confirmation. Reduced motion arrives immediately, with no animated confirmation samples. See adjacent JSON for measured outcomes. Read-only frame observation was appended by a local QA server; it is not shipped in the application.

Three portable suites passed four fixture iterations each: reveal, post-Surface scrolling and press input. Independent review confirmed frame removal, continuous release and assistive origin fixes; rebuilt preview matches candidate CSS/markup. Physical iOS Safari, forced colors and the full repeated release matrix remain untested in this sprint.

## Delivery

Review branch: `demo/button-press-feedback`. Preview path: `demos/button-press-feedback/`. No live application change. Main site remains on the last published desktop-scroll adjustment.
