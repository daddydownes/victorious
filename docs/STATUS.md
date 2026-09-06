# Current status

Updated September 6, 2026. The user approved publishing the Flappy V redesign after reviewing its visuals, mandatory openings, death animation and win screen. Release source follows `77b3bd2`; deployment verification is pending the push to main. Prior production was `5f098d6`.

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

## Approved release — fullscreen Flappy V

The user rejected the portrait-frame redesign (`44401b5`) and asked to retain the original live game's fullscreen black-and-gold atmosphere and animated background. The current candidate restores that presentation while introducing visibly different obstacles every 25 successful clears. The V-and-star logo and tap/click/Space physics remain.

Stages: 0–24 dimensional pillars; 25–49 floating, deploying arches; 50–74 diagonal passages; 75–99 heavy closing jaws with smooth rounded lobes. All use a shared polished black-metal/brass material and shared draw/collision polygons. Every opening is mandatory: crossing its mouth above or below the channel ends the run without a point. The last jaws preserve a 104-unit minimum opening. Original gold dust, bokeh, parallax and streak animation are restored. A discovered resize/input race is fixed so a resize pause cannot secretly apply a flap.

Death animation refinement after `a1941ad`: small upward recoil, gentler gravity, ten gold particles, a .24–.74s logo fade and a fixed .78s ending. Course travel eases down exponentially; dying frames now use the same interpolation as play. Retry panel has a 180ms entrance only when reduced motion is not requested. Twelve height/cadence death cases verify recoil, duration, input lock and retry; 106 lifecycle cases and collision/reveal checks pass. Difficulty checks also pass, and desktop Chrome reaches the retry panel after a fresh run. This was not a frame-by-frame animation or physical-device audit. Active-flight physics and mandatory-opening rules are unchanged.

Mandatory passage update after `ba46c76`: the user wants going above/below arches, slalom and jaws to fail. `flapTraversal` now ends the run at an outside mouth crossing or channel departure. Approach remains recoverable before the logo centre reaches the mouth; physical rail hits still use the visible silhouette. Start copy explains the rule. Difficulty checks include fatal bypasses across five viewport sizes and six approach/crossing boundary cases. Collision (254), lifecycle (106) and embedded-script/reveal checks pass. Twelve complete physics-driven flights (1,200 clears) also pass with the mandatory-route rule. Updated start instructions verified in Chrome. No new physical-device testing.

Minimal finish refinement after `ab722e6`: removed etched panels, diagonal machining, moving glints and thick stacked gold bands. All obstacle types share a continuous satin face and thin brass opening edge. Stretch the vertically constant material once per object to eliminate tile seams. Geometry and physics are unchanged. Material/cache checks, 254 collision checks and embedded-script/reveal checks pass; all four studies visually reviewed in desktop Chrome. This is still preview-only, with no new physical-device validation.

Latest refinement after `5c16dc0`: obstacle widths reduced about 16–21% (42/54/60/68→78 reference units). Pillar ends now use rounded sampled corners shared by rendering and collision; material transitions are softer. All four revised stage studies inspected in desktop Chrome. Updated collision suite passes 254 checks; difficulty, material, 106 lifecycle cases and 12 full-flight witnesses / 1,200 clears also pass. This remains a preview, not a deployment or physical-phone verification.

The user requested five Sol and two Astra agents; runtime concurrency/thread limits prevented that roster. One new Sol specialist completed five design/implementation/visual passes while two existing reviewers handled geometry and physics in parallel. Do not claim seven simultaneous agents. The final Chrome review approved the rounded-jaw direction after rejecting an earlier shallow version.

Current evidence: 12,500 generated gates, 242 grouped collision checks with 16,016 boundary samples, 12 complete physics-driven flights (1,200 genuine clears, exactly 25 of each type), and 106 lifecycle cases. Material tests verify clipping and the 64-entry / 16 MiB sprite-cache limits. Native desktop Chrome checked all four design studies, fullscreen layout, original atmosphere and live pause/resume. These are not physical-phone, universal browser-performance or human difficulty guarantees. See the [fullscreen review](reviews/flappy-fullscreen-review.md).

Run `python3 tools/flappy-demo.py`, then open `http://127.0.0.1:8938/demo`. Click a stage to inspect its design with moving ambience; **Play this stage** starts a real test flight. **Preview win** invokes the actual win presentation at 100 in isolated demo storage; desktop Chrome verified the VAULT UNLOCKED / VAULT-100 panel and gold burst. Preview storage is separate from saved live rewards. `/` serves the unmodified candidate. Publication is explicitly authorized. The full four-pass browser/device matrix remains incomplete and is deferred for follow-up; do not describe this as a universal device QA pass. See the release record in `docs/reviews/flappy-release-2026-09-06.md`.

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
