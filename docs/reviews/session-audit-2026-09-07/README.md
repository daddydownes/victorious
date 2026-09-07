# Session audit evidence index

The parent report is [`../session-audit-2026-09-07.md`](../session-audit-2026-09-07.md). Evidence here has two distinct baselines:

- Flappy V boundary and frame-timing evidence exercises local repair commit `a272869` on `fix/flappy-progression-20260907`.
- Mobile, navigation and general runtime evidence exercises the verified live commit `46226be139353d81947499ec5552c52547d68011`.

## Flappy V repair candidate

`flappy-boundaries/` contains active-game Chromium screenshots at scores 24, 25, 49, 50, 74 and 75 plus `report.json`. Score and gate position were deliberately seeded. These images verify the rendered obstacle and HUD at each boundary; they do not represent a human 75-clear run.

`frame-timing/` contains Chromium screenshots at 25, 50 and 75 and `frame-timing.json`. Timing uses a three-second warmed window and a synthetic centred-gate survivor on a shared desktop machine. It is not physical-device, GPU-memory, human-play or universal smoothness evidence.

## Verified live baseline

`mobile/short-viewport/` contains the 540×360 Chromium and WebKit screenshots where the Vault entrance is entirely below the locked viewport, plus exact element bounds in `results.json`.

`mobile/focus/` contains reduced-motion Chromium and WebKit screenshots after Tab reaches a covered legacy control, plus the full focus sequence in `results.json`.

`mobile/responsive/` contains a representative 320×568 landed-Vault screenshot and the responsive matrix data. [`mobile/report.md`](mobile/report.md) gives reproduction steps, passing coverage and limits for the current non-Flappy mobile audit.

`runtime-slow/` contains the emulated slow-network measurements and a representative final Play-section screenshot. No pending-state screenshot was captured; the hidden-text risk while the title image is pending comes from the measured readiness delay plus the current CSS.

`runtime-fast/` contains the cross-engine runtime measurements and a representative Chromium invitation screenshot. These are local browser-engine measurements at the exact live commit, not physical-device or carrier certification.

[`navigation-live-safari.md`](navigation-live-safari.md) records the native Safari journey and accessibility-tree evidence. That tool session allowed visual inspection but did not provide a documented standalone screenshot export.
