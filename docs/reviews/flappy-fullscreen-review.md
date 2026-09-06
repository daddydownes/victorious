# Fullscreen Flappy V — original atmosphere, new passages

This candidate supersedes the portrait-frame design in `44401b5`. It is on `demo/flappy-v-redesign`, not deployed to main. The user explicitly selected the original live .com game's fullscreen black-and-gold atmosphere as the reference and requested a clearly different challenge every 25 points, more dimensional obstacles and smooth matching forms.

## Implemented direction

The unchanged V/star flies across a full-window canvas again. Original gold dust, motes, bokeh, parallax, floor perspective and speed streaks are restored. Every obstacle uses the same clipped, sculpted black-metal/brass material, with dark side returns, layered passage bevels and moving highlights.

- 0–24: dimensional full-height pillars.
- 25–49: finite floating arches that deploy around an open passage.
- 50–74: slanted tunnels, retaining deployment and approach movement.
- 75–99: heavier closing jaws with broad rounded lobes, retaining the earlier movement and increasing traversal precision.

The final jaw went through visual revision: an initially shallow wave did not look different enough. The final 24-unit cosine lobes and solid outer backs read as a distinct closing form. This also follows the user's later instruction against harsh spikes. The neutral opening widens by 48 units to preserve the authored minimum of 104 at the lobe peaks.

Drawing and collision use the same hazard polygons. Floating-object bypass is safe but scores nothing; only entering and clearing the passage counts. Score-based queue progression prevents skipping objects from permanently advancing difficulty. The existing silhouette collision, saved rewards, flap/gravity model and reduced-motion poster remain. A resize/input race found during this sweep was fixed: a resize detected by a flap now pauses without injecting velocity.

## Agent scope

The user requested five Sol and two Astra agents. The runtime concurrency/thread limit prevented creating that roster. The work actually used one new Sol specialist across five bounded design/implementation/visual passes and two existing reviewers concurrently for physics and geometry. Do not claim seven simultaneous agents or five distinct Sol agents. The parent integrated the fullscreen layout, original ambience, rendering, fixes, preview and handoff.

## Evidence

- [Geometry review](flappy-fullscreen-geometry.md): 12,500 generated gates, 65 passage/bypass fixtures, 242 grouped collision checks and 16,016 aperture/polygon samples.
- [Physics review](flappy-fullscreen-physics.md): 12 complete 100-point flight witnesses across portrait, desktop and landscape aspect ratios. Every replay cleared exactly 25 of each type, with no bypass scores. 106 lifecycle fixtures include the new resize/input regression.
- [Final flight output](flappy-fullscreen-flights.json): actual results from the final rounded-jaw geometry. These are executable sampled solvability witnesses, not human win rates or exhaustive proof of every possible route.
- [Chrome visual review](flappy-fullscreen-visual.md): fullscreen layout, original atmosphere, all four material/shape studies and live pause/resume. The parent additionally refreshed and inspected the final rounded-jaw study in Chrome after integration.
- `tests/flappy-material.cjs`: actual embedded renderer is tested for clipping, angled rails, material reuse, degenerate inputs, 64-entry eviction and 16 MiB byte accounting. The material raster width is capped at 2048px. These bounds do not measure total GPU memory or physical-device frame rate.
- Reveal, invitation press, post-Surface scrolling and Surface input regression suites pass. Embedded JavaScript parses and whitespace checks pass.

## Preview and limits

Run `python3 tools/flappy-demo.py`, then open `http://127.0.0.1:8938/demo`. Click Pillars, Arches, Slalom or Jaws to inspect the design with animated ambience. Play this stage starts a test flight. The helper and separate demo storage exist only in that response; `/` serves the unmodified candidate. The Desktop shortcut points to the same local preview.

No physical-phone, universal browser smoothness or completed full-site release matrix is claimed. The earlier full-site integration attempt was interrupted by active browser interaction. Landscape also presents a smaller uniformly scaled logo than the old minimum-pixel implementation. Player feedback and the remaining browser/device journey checks are still needed before calling the candidate fully release-tested or publishing it with authorization. Production main is unchanged.
