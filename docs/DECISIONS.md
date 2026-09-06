# Decisions and recent changes

This is a curated record of recent work, not a claim to reconstruct every earlier session. Git history remains the detailed code record. Older root demos are preserved as experiments and are not production references.

| Commit | Change | Reason / constraint to preserve |
| --- | --- | --- |
| `0272220` | Approved opening V/star social artwork | User chose the clean white mark on black, replacing a stale event card. Versioned PNG URL helps identify the new asset. |
| `c19c39d` | Reveal finishes on `nextDropSettle` animationend | A 1750ms timer settled before the button’s animation ended at about 2070ms, causing a visible snap. |
| `d145598` | PRESS HERE / ENTER THE VAULT | User preferred a large direct invitation; main entry is tap/click, not hold. |
| `192cd77` | Subtle button light sweep | User chose the light-sweep demo. Keep text readable above the effect. |
| `10c2a79` | Faster post-Surface scrolling | Earlier wheel/touch travel was too slow and sustained scrolling hit a hard cap. Preserve continuous budget recovery. |
| `75d85d0` | Synchronized button and logo lighting | User wanted the button to animate more often while flowing with the logo. Shared 5.4s timeline; two button sweeps per logo cycle. |
| `dbb4f9b` | Search ownership verification file | Enables approved Search Console ownership. Preserve it during cleanup. |
| `f5b625e` | Evergreen search/social description | Google had retained old open/date claims. Stable brand copy avoids ongoing event-date maintenance; Google recrawl remains external. |
| `e7a7859` | PC wheel/trackpad travel reduced 20% | Latest user feedback: final section too fast on PC, phone okay. Reduced wheel delta, cap and recovery together; touch and 45ms response left intact. |

## Organization decision

Added a README, agent entry point, `docs/` and portable `tests/` without moving production assets, demos or historical QA reports. This makes the repository understandable across devices while preserving URLs and history. Code modularization or moving demos can be a separate future task with explicit path/dependency checks.

## Approved frameless press feedback

September6: user approved the final gold-touch study for production. Remove inset frame/box on press; retain contact-origin bloom and sharp dark text. Match held and released light state, centre keyboard/assistive activation, and disable movement for reduced motion. Preserve entry timing, idle logo synchronization and phone scrolling. Release and coverage are recorded in `reviews/press-release-2026-09-06.md`.

## Gold Lift Surface selection

User selected option3 from the three Surface demos and authorized integration after testing. Keep a solid gold capsule, rising reflection, dark label and compact upward arrow. Idle animation is limited to the open vault; the exit cue finishes within280ms and does not delay the existing2050ms Surface transition. Preserve touch guards and native keyboard activation; reduced motion uses static gold styling.

The same release removes the circular avatar from the vault’s top-right corner, explicitly requested by the user. Keep the main VCTRS identity and archive unchanged; the old asset remains in Git.

## Surface press simplification

After the Gold Lift release, user found the pressed animation unclean and asked to change only that state. Removed the arrow’s disappearing/restarting loop, the extra exit reflection and the1px text shift. Retained the idle appearance/shine; pressed and accepted state now softly shade the gold while text/arrow remain steady during the existing HUD fade. No input or scene timing changes.

## Remove screen-edge decoration

User reported an intermittent gold outline around the mobile screen after Surface and requested complete removal. Retired both the viewport-wide vault focus outline and the pulsing bottom underglow, including its runtime work. Keep keyboard control focus cues local, without outlining the whole screen.
