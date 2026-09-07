# Decisions and recent changes

## September 7, 2026 — centred ending and release preparation

Centre the painted vault invitation, place its button below it, centre the button label while retaining its separate arrow, and centre the VCTRS mark above the gallery. Preserve the established sizes, pigment and paint animation rather than creating another transition or camera layout.

Production links remain relative for local previews and the real domain. Canonical/social metadata points to the existing vctrsclo.com routes and approved share artwork. The embedded automatic game is not a search landing page. Keep all hosting and ownership-verification files unchanged.

Require a nonzero visible portion of the film section before playback. A zero-area IntersectionObserver edge touch must not start or download the film. Keep the current accepted end-only Replay behavior; this readiness pass does not reverse the earlier restored demo. Load the six gallery photographs lazily without changing their files or layout.

## September 7, 2026 — natural flaps, ten-clear styles, 100-point goal

Keep the original game's 100-point reward. Repeat the four obstacle styles every ten clears, without accelerating the original speed and spacing curve. Apply the same explicit source adaptation to the root and story game so entering from either route plays the same rules. The immutable upstream snapshot remains unchanged.

Remove the V's trailing stroke, keeping the rendering interpolation history. In the automatic preview, move the V only through the original upward impulse and gravity: steer by flap timing, never by position nudges, clamps or a sine wave. Show a centred, gently varying course with settled portals and sufficient opening space to demonstrate uninterrupted natural flight. These presentation choices do not widen the actual game's gaps or bypass its collisions.

## September 7, 2026 — restore the actual production game

The user identified that the new invitation was opening a different game. The earlier integration preserved production source in the root but opened an obsolete game snapshot from the story. Restore the actual `e972c19` production game, including its four courses, controls and reward behavior, while preserving the painted invitation and accepted story art. This supersedes earlier decisions to retain the older story engine and its replacement 100 Club screen.

Extract the production game from one pinned source rather than maintaining another handwritten engine. Keep story-specific focus, inert background, scroll restoration and animation cancellation in a small host adapter. The automatic preview shares production rendering and portal geometry, uses a visual pilot, and never saves progress. Source identity and tests against the played story engine prevent the same integration mistake recurring.

## September 7, 2026 — Surface gold match

Use the original production V's hot gold (`#f0d492`) through the Surface handoff and the story opening. The darker amber remains the established colour for the other story elements. Share the logo colour and shadow in the builder instead of styling each page independently. Preserve the accepted logo geometry and other saved work; no additional agents are required for this scoped correction.

## September 7, 2026 — release sprint

- Preserve the accepted layout, V-and-star opening, game mechanics, film policy and six photos. Reimagine vault lettering and reduce filler rather than adding another camera transition.
- Use the same gold aerosol treatment for Back to the vault. Keep the action a native Enter the vault link; label the original-page restart Start again.
- Keep story scrolling native. Reduce excess mobile space rather than adding artificial wheel or touch acceleration.
- Isolate paint media queries from the film listener after reproducing missed dynamic reduced-motion notification in Chromium. Keep visible fallback text when artwork fails.
- Prepare and verify locally. Physical-device checks and explicit public release remain separate from browser-engine emulation and a local saved candidate.

## Local complete experience — September 6, 2026

User selected the accepted Portrait Depth animation with the newer supplied event film beginning at second 4 and continuing to its end. Preserve its composition and wording and six later photos. The final user correction replaces only the opening and Surface wordmark with the exact original V-and-star from the root film logo; retain the full VCTRS lettering behind the film. The latest user correction removes the opening tagline and both earlier icon designs. Show only an animated “Scroll” label; the later no-lines correction removes the descending rule. Show Replay only when the film ends, with no Pause. Preserve black title/logo cards from the continuous cut.

Integrate through the real archive and original restart lifecycle in a separate candidate worktree. Public publishing and real signup submission remain outside this local demo. Thirty earlier specialist reports informed targeted logo, resize, return-route, storage and refresh fixes; unrelated layout/game redesigns are deferred.

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

## Flappy V redesign candidate

User first requested stacking challenges every 25 points and five sequential agent reviews. They then explicitly treated that implementation as a prototype and requested a full, heavily reviewed redesign because it was too easy, movement needed work and moving words looked odd. Preserve the core Flappy mechanic and the exact V-and-star logo as the bird. Redesign the surrounding experience, not that identity.

Use a fixed logical arena so changing device orientation does not make gaps easier. Keep graphical hazard previews and ease gates to rest before contact. The final 25 combine pins, shifts, narrow openings and longer gates. Native stage labels replace copy moving between obstacles. User further requested dimensional, beveled poles and visibly accurate hits: derive logo collision from the actual rotating SVG and keep pole clipping shared with visual geometry. No invisible forgiving circle. Saved rewards remain intact; local demos use separate storage. See the redesign review for tests and the distinction between mathematical reachability and human difficulty.

## Return to the original fullscreen atmosphere

The user rejected the narrow portrait playfield and removed ambience, specifying the original live .com game as the reference. Restore fullscreen, moving gold particles/bokeh/parallax and the unchanged logo. Introduce genuinely different passage shapes every 25 clears instead of only tightening poles. The user subsequently requested smooth, matching forms without harsh sharp edges; final jaws therefore use prominent rounded lobes with solid backs, superseding angular fang experiments. All stages share one black-metal/brass material. Floating obstacles can be bypassed without invisible collision, but only a complete passage scores. Keep the new visuals as a candidate until reviewed for release.

## Compact obstacle proportions

Following `5c16dc0`, the user found bars too long and pillars insufficiently smooth. Shorten horizontal widths about 16–21%, round the pillar ends and soften the shared brass/metal shading. Keep vertical openings and core flap physics unchanged. Shorter passages reduce time spent inside each obstacle; executable flights establish reachability, not human difficulty balance. Continue preview iteration before release.

## Minimal obstacle finish

The user likes the base but finds the obstacle treatment overworked. Replace ornamental machining, moving glints and layered bevel bands with one smooth dark satin face and a narrow brass opening edge. Preserve the shorter geometry, rounded pillar ends, stage mechanics and shared collider. Favour a consistent restrained material over extra visual effects.

## Mandatory openings

After the minimal finish, the user explicitly requested that flying underneath or above arches, slalom and jaws fail. This supersedes the earlier safe-unscored-bypass decision. Kill at the logo centre's outside mouth crossing or a channel departure; do not kill during a still-recoverable approach. Preserve visible obstacle geometry and precise physical-contact collision. Explain the rule in the start panel.

## Post-film motion and paint direction

The next refinement removes all supporting words under Fly the V except “Play the game” and a functional animated arrow. Remove the 100-point invitation copy and duplicate preview label; preserve scoring and its surprise inside the game. This supersedes the earlier visible challenge invitation. Arrow motion follows preview placement and respects reduced motion.

Latest clarification: the game invitation's scrolling presentation should look as if someone sprays the letters onto the page. Follow the actual painted strokes using the accepted artwork, retain deposited paint on reverse scroll, and centre the invitation group. Avoid a whole-image fade, decorative lines, glow, replacement artwork or gameplay changes.

User requested a clearer invitation to play, a 100-point surprise and a more animated transition into the vault. Use an actual hidden 100 Club visual reveal. Preserve the original V-star opening, source film and six photographs. User subsequently rejected glow, posh typography, simulated distressed lettering and decorative lines. Remove those additions and use the generated transparent aerosol-lettering PNG for Fly the V. Retain clean bold type in the memory and vault sections.
## Restore the accepted demo

September7: user says take it back to how it was after trying the flowing transition demo. Restore the accepted minimal-Play-cue version from before that pass, including its previous film behaviour. The new camera/photo-plane/Surface experiment is rejected; preserve its run evidence separately.


## Paint the invitation wording

September7: user asks for the arrow to be genuinely spray-painted, then explicitly confirms changing the large Fly the V title to Play the game and removing the small typed label. Preserve the restored layout and film behavior. Use real generated pigment assets, retain native button semantics, and keep the game itself named Fly the V. The old lettering asset is preserved but no longer used for this heading.

## Remove the memory interlude

September7: user explicitly removes the full Some things stay with you / The people / The nights / The moments / Keep exploring section. Game is now immediately followed by the vault invitation. Preserve the newly confirmed painted Play the game heading and painted arrow.
