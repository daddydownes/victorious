# Button press feedback candidate

Local candidate only; not deployed. Serve the repository and open `/demos/button-press-feedback/` to replay the look without the intro. Open `/` for the actual candidate journey.

## Finding and proposed treatment

The current button changes to a flat gold background while active, with no distinct confirmation effect. After acceptance the existing card choreography fades its contents from 297ms to 726ms into the 1650ms transfer; that naturally includes the button. This is a code-level explanation for its disappearance after release, not a claim to have reproduced every reported visual issue.

This candidate adds an inset gold edge, a layered metallic gold face and a readable dark label during native press. Acceptance carries that face into a short 280ms gleam, finishing before the outgoing card begins fading, using a new `::after` layer. The button itself never receives a new opacity animation. The synchronized idle sweep stays on `::before`; all production JavaScript, entry/fade timing, focus and input guards are unchanged. Reduced motion uses static feedback without label movement or the confirmation animation.

## Validation and remaining review

- `node tests/reveal.cjs`: pass, normal/reduced cases four times plus script syntax.
- `node tests/post-surface-scroll.cjs`: pass, including unchanged 92px wheel response and touch cases.
- All production script blocks compare byte-identical to the base commit.
- `git diff --check`: pass.
- Local standalone demo viewed in native desktop Chrome; click reached the replay-complete state and button stayed present.
- Root refinement removes fractional label scaling, keeps an integer 1px press displacement, adds a precise inset rim and shortens confirmation to 280ms.
- One full natural-intro desktop Chrome candidate journey completed: press feedback captured visibly and vault arrived with focus on the archive.
- Full four-pass device matrix, frame sampling, phone emulation and physical Safari review remain before production release.

The demo intentionally stays visible after click so the owner can inspect/replay the treatment. It does not claim to reproduce the actual outgoing card fade.
