# Live-after story check

- Release: `b234910759464b5fed809e35d36909f46977afe5`
- URL: `https://vctrsclo.com/experience/`
- Result: PASS, two focused cases

Chromium 1280×720, normal motion:

- Story film reached ready state 4 and played; its loading status was hidden.
- Held Play title and arrow requests displayed the readable pending labels. Resolving both requests revealed the original 1536px title and retained the exact title and control rectangles.
- Automatic preview retained ten progress segments and its ten-clear visual cycle.
- Actual game opened with `0 / 100` and “A new challenge every 25.” Opening it paused the story film and preview. Pause showed `PAUSED`/`Resume`; Escape closed the overlay and restored focus to `#journey-play`.

WebKit 390×844, reduced motion:

- Film remained intentionally unloaded and paused with non-announcing `Film paused` status.
- Original 1536px Play artwork rendered visibly; preview retained ten progress segments.
- Game opened with `0 / 100` and the reduced-motion poster. Escape restored focus to `#journey-play`.

No page or console errors occurred. No forms were submitted. This was a focused browser check, not a full navigation or physical-device rerun.

Machine-readable evidence: `results.json`.
