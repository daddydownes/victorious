# Continued scrolling during Vault entry

## Report and baseline

The user reported that the newly published entrance glitches when scrolling continues. At `483f653`, a controlled 26%-visible start followed by sustained positive wheel input reproduced a 45px backward jump in Chromium: scroll Y moved from 3652 to 3607 while the animation was running. The initiating wheel's native movement raced the animation's captured starting position. All observed wheel events were cancelable; noncancelable momentum is a resilience concern, not the demonstrated cause of this trace. WebKit did not show that backward jump in the same run.

One injected -1px reverse tick during otherwise positive wheel input also restarted the animation in both engines. See [wheel summary](wheel-before.json) and [Chromium trace](chromium-before-trace.json).

Trusted Chromium touch tests reproduced repeated cancellation/restart on three further forward swipes: six settling-state changes and 25 incomplete-frame samples in portrait, five changes and 22 incomplete-frame samples in landscape. Portrait entry remained unfinished at the end of the sampling window. New `touchstart` unconditionally cancelled the committed animation. See [touch baseline](touch-before.json).

These are isolated browser and touch-emulation reproductions, not physical-device testing.

## Correction and focused validation

Source `ed150d8` (`92b7bb4` before integration) consumes an already eligible initiating wheel/key synchronously, keeps the applied animation position monotonic, and retains the same timeline when another single touch starts. It suppresses cancelable committed touch movement until a deliberate reverse crosses 12px, with normalized wheel units and native behavior outside commitment. At exact landing a cancellable timeout waits for 140ms of input quiet and released contact before activating the child. No busy frame loop, media transform or child Vault change was added.

[Desktop stress](wheel-after.json) passes in Chromium and WebKit for sustained positive wheel input and positive input with a tiny reverse tick: zero backward steps, exactly one entry, and an input-quiet handoff. [Touch stress](touch-after.json) now reports one settling transition and zero incomplete-frame interruptions in both portrait and landscape. Deliberate reverse cancellation/recovery and active-child panning pass. Later fresh gestures may legitimately pan the active Vault after the handoff. See [continued phone entry](phone-continued-entry.png) and [landscape landing](landscape-landed.png).

Test checkpoint `6b208e9`: navigation VM 12/12, integration/deterministic build 15/15, protected game source and all 37 original media bytes pass. The [eleven-case browser refresh/history matrix](history-local.json) remains green. Only story output and its development version change; root, embedded Vault and game preview are preserved.

All [eight broader browser scenarios](regression-local.json) pass, including sixteen repeated desktop/portrait/landscape/narrow-keyboard loops, delayed loading, reverse retry, reduced motion and automatic landing after mid-entry resize. An old resize harness briefly sampled the gap between settling cleanup and next-frame activation, then attempted an unsupported wheel input in mobile WebKit; the corrected harness directly waits for activation and requires automatic completion without a retry. This was a test timing correction, with no product workaround added.

Six Sol agents divided implementation, tests, browser/input, runtime and remote review; Astra independently reviewed the correction and evidence. No physical trackpad/phone, physical browser-edge gesture or physical pinch certification is claimed. No forms were submitted. Publication follows the existing GitHub Pages authorization.
