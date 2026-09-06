# Approved frameless press release — September 6, 2026

User approved publication. Release homepage is byte-identical to reviewed candidate `fe968bf`; merged candidate history with main, resolving only the documentation status conflict. No unrelated application changes or asset moves.

## Validation

- Three portable suites pass (four fixture iterations each): reveal, desktop/touch scrolling and press input, including canceled pointer followed by assistive activation.
- Exact approved candidate previously passed observed desktop1440×594, phone375×667, landscape667×375, and reduced-motion landscape667×375 journeys; see the sprint record. These were one journey per environment.
- Release check adds four consecutive fresh reduced-motion Chrome journeys at885×594. All arrive immediately with visible vault, opacity1, correct focus, one live mark, no transfer mark, no recorded errors. Adjacent JSON stores results.
- Existing phone tuning, shared idle clock, animation cancellation and metadata preserved. Reduced motion disables press bloom and label movement; entry does not depend on animation completion.

## Coverage limits

Browser tests used native macOS Chrome plus viewport/device emulation. Physical iPhone/Android, real Safari/Firefox, forced colors and every device model were not tested. The entire TESTING.md release matrix was not rerun; this authorized focused release uses the unchanged candidate’s recorded sprint evidence plus repeated reduced-motion and portable checks. Previously recorded unrelated accessibility issues remain tracked in STATUS.md.

## Publication verification

Release `a3d0e63`: GitHub Pages reported built; canonical homepage bytes exactly matched committed source. Native Chrome on the real .com completed a normal-motion intro → press → vault smoke check, with focus on the archive. Normal motion was restored after the reduced-motion checks.
