# Current status

Updated September 6, 2026. Production remains at the screen-edge cleanup (`d1b046d`, latest production docs `5f098d6`). This branch, `demo/flappy-v-redesign`, contains a new Flappy V candidate that has **not been deployed**. `033db26` preserves the preceding prototype.

## Current production state

- Live at https://vctrsclo.com, published from `main` / repository root on GitHub Pages.
- Approved share card: opening white V/star on black, 1200×630, `assets/share-v-20260906.png`; `og.jpg` is the matching JPEG.
- Main invitation: **PRESS HERE** with **ENTER THE VAULT** beneath. Tap/click/keyboard entry.
- Reveal waits for the final animation, preventing the previous settling jitter.
- Top-right circular vault logo removed at the user’s request.
- Screen-edge effects removed: no viewport-wide vault focus outline or pulsing post-Surface bottom glow. Keyboard focus uses the local drag cue and control indicators.
- Gold Lift Surface button: gold capsule, rising reflection, 48px target; reduced motion keeps static gold styling. The Space-key activation issue is fixed.
- Approved press feedback: continuous gold surface, contact-origin light and smooth release, no inset frame. Reduced motion disables the moving light and text displacement.
- Button light sweep every 2.7s, synchronized with the logo’s 5.4s cycle. Reduced motion disables those effects.
- Desktop post-Surface wheel/trackpad travel is 20% gentler than the previous accelerated version. Phone touch behavior is unchanged by the latest adjustment.
- Page and social title: **VICTORIOUS — The Vault**.
- Meta description, Open Graph and Twitter description: **Discover VCTRS (Victorious), a Canberra clothing brand. Explore the vault and sign up for updates.** Keep this evergreen.

## Current work — Flappy V redesign candidate

The user requested much harder cumulative challenges every 25 gates, then expanded the task to a full visual/gameplay polish with many sequential specialist reviews. They explicitly preserved the core Flappy mechanic and the V-and-star logo as the bird. They also requested dimensional poles and accurate visible contact.

Implemented fixed 420×720 logical geometry across screens, smooth patterned routes, falling pins at 25, shifts at 50 and tight/wide squeezing locks at 75. The logo's original SVG drives both drawing and rotated silhouette collision. Pole bevels match their collider. Travelling words and visual clutter are removed; native score/stage/progress controls stay outside the course. Stored rewards and original flap/gravity remain. See [architecture](ARCHITECTURE.md#flappy-v-redesign-candidate) and the [redesign review](reviews/flappy-redesign-2026-09-06.md).

Run `python3 tools/flappy-demo.py` and open `http://127.0.0.1:8938/demo`. Stage shortcuts and Pole detail are local review controls, with separate demo storage. `/` is the unmodified candidate. The earlier prototype is historical and its circle-hitbox test results must not be confused with current silhouette results.

Current automated evidence: 12,500 gate fixtures across five CSS sizes, 36 full100-gate paths replayed through actual silhouette collision, 50 dedicated geometry checks and 102 lifecycle fixtures. Reveal, press, Surface and scrolling regression suites pass. These are not human difficulty measurements or physical-device performance proof. Browser review scope and remaining release matrix are recorded in the review. The candidate still needs player assessment and remaining browser/device release checks before an authorized production publication.

Screen-edge removal already live: no viewport-wide vault focus outline or pulsing bottom glow. The PC scroll retune remains separate from phone touch behavior.

## Google status — pending observation

Search Console ownership was verified and a homepage indexing request was confirmed. At the last observation, Google still showed an old dated/open snippet, and its last crawl was August 29, 2026. The current metadata is live, but a refreshed Google snippet has not been verified. Do not resubmit indexing repeatedly or promise exact snippet text; Google selects its own snippet.

## Verification actually completed

| Work | Evidence and limits |
| --- | --- |
| Latest desktop retune | Offline extracted-handler checks ×4: 100px wheel input moves 92px instead of 115px; sustained fixture 1178px instead of 1472px. Reversal, bounds, bypasses and touch behavior pass. Touch handler source unchanged. Live homepage exactly matched published source. No new full browser journey for this numeric adjustment. |
| Reveal repair | Normal/reduced-motion handler checks ×4; prior Chrome frame sampling on desktop, phone portrait/landscape and reduced motion found final movement below .001px instead of the old ~3.37px snap. |
| Lighting synchronization | Prior desktop and emulated-phone 12.5s samples found matching start/current times and 5400ms duration for all four effects; no layout movement. Reduced-motion effects absent. |
| September 6 network double-check | Homepage exact match, 24 resource byte checks, canonical redirects, approved artwork and video range loading passed. |
| Prior broader browser QA | Desktop/emulated-phone vault and game journeys exercised. Historical reports have narrower commit/environment scopes; none establishes universal physical-device coverage. |

`tests/` contains portable focused reproductions, not the complete old browser recordings. Older frame logs and screenshots were kept on the original workstation and have not been uploaded. Real physical iOS Safari and actual Instagram/Snapchat-generated cards remain unverified in this session.

## Known issues carried forward

These findings were recorded in earlier QA and have not been fixed by the metadata/scroll changes. Reproduce against the current commit before working on them.

| Issue | Reproduction / scope |
| --- | --- |
| Extreme zoom clips controls | Desktop 400% zoom can put signup/vault controls below a wheel-locked viewport; 200% fit in prior checks. |
| Premature footer receipt | Submit footer/legacy form with mocked delayed or failing transport; Received appears before completion and reverts on failure. |
| Hidden form in reduced-motion tab order | Fresh reduced-motion load, then Tab; invisible legacy email controls can receive focus. |
| Premature live-region receipt | Hidden `seamRcv` exposes receipt text before signup. |
| Crew image sizing | Twelve generated lazy images omit intrinsic dimensions. |
| Signup state inconsistency | Main next-drop success does not suppress the later footer ask; duplicate submission remains possible. |
| Permissive email validation | `goodEmail` accepts some malformed domains, e.g. `a@b..com`. |
| Input contrast | Placeholder and border visibility merit a focused accessibility check. |

Owner for triage: next maintainer working with the site owner. These are recorded as deferred follow-ups, not as fixed or release-approved. The stale share-image issue is fixed and must not be reopened from old reports.
