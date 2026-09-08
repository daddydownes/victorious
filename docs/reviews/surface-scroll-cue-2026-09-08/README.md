# Scroll cue after the Surface loop

Baseline `1e24e48` focuses the Scroll anchor during the embedded Vault → Surface reset. A real live WebKit pointer/wheel loop reproduced its visible 2px outline; initial arrival has none. See [baseline](before.json) and [screenshot](before-desktop.png).

The builder now makes the existing visually hidden opening heading programmatically focusable and restores focus there with `preventScroll`. Scroll retains its ordinary keyboard focus styles. No input modality protocol, CSS suppression, animation, media or game change is added.

[Local browser verification](after.json) passes sixteen repeated loops: four each in WebKit 1280×720, Chromium touch-emulated 390×844 and 844×390, and reduced-motion WebKit 320×568. Desktop/reduced Surface activation alternates pointer and keyboard. Every return focuses the heading, leaves Scroll unhighlighted, and matches first-arrival cue geometry, outline, color, background and shadow. Keyboard navigation then focuses Scroll visibly and Enter reaches the portrait heading. WebKit uses Option-Tab to include links under its default macOS preference; Chromium uses Tab. Plain WebKit Tab skipping links was reproduced in an isolated heading/link/button fixture and required no product workaround.

Screenshots: [first arrival](first-desktop.png), [returned Surface](after-desktop.png), [intentional keyboard focus](keyboard-focus.png), [phone](after-phone.png), [landscape](after-landscape.png). Root inspected before/after desktop and phone screenshots. These are browser emulations, not physical-device or screen-reader certification. No page errors or real form submissions.

Source validation: navigation VM13/13, deterministic integration15/15, protected game source, media37/37 byte-exact, and all ten repository root suites pass. Astra independently approved the minimal focus change.
