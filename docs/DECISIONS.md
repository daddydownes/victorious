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
