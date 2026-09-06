# Flappy V final independent audit — September 6, 2026

Sequential review pass 10. Reviewed the working candidate against prototype `033db26`, not a deployed release. Candidate `index.html` SHA-256: `eab330927bfe4e90b52dae2e29919711f3cc190be507f0771216e2cef11639ed`.

## Assessment

No blocking defect found in the reviewed rendering, collision or lifecycle paths. This is a reviewable redesign candidate; this audit did not publish it or verify production deployment.

- The exact original V-and-star SVG path remains unchanged. The rendered transform and collision transform use the same centre, 34-unit height, position and rotation.
- Collision follows two filled contours, including the star and the open centre of the V. Cubic flattening is bounded below .048 logical pixels. Antialiasing is not a promise of mathematically identical physical pixels.
- Pole polygons match the clipped cap silhouette, including horizontal width scaling and vertically compressed partial reveals. Lighting stays inside the physical shape; the early dashed warning is decorative and not a solid obstacle.
- Obstacle changes settle before approach; speed eases rather than jumping on a score boundary. First, second and third challenge layers persist through the final tier. No moving words remain inside the gaps.
- Sprite work is cached; contour transforms reuse storage; eight saved frames and bounded/pruned gates prevent growth in normal runs. This is a code/bounds assessment, not a physical-device frame-rate benchmark.
- Existing reward keys and first-unlock behavior are retained. Demo storage is isolated. No live rewards or user progress were reset.

## Fresh checks

`node tests/flappy-collision.cjs`: 50 checks passed, two contours with 33 and 79 vertices. `node tests/flappy-lifecycle.cjs`: 102 cases passed, including scheduling/focus fixtures, stalls, resize, input and narrow-gap survival. `git diff --check` passed. Earlier expensive reachability witnesses were not rerun in this final pass; refer to their own evidence.

Native desktop Safari opened the current local demo. Observed the refreshed idle screen, static Pole detail study, score/tier shortcuts at 0, 25, 50 and 75, dead panel, P-key pause at 0/25/50, and resume followed by re-pause. Escape closed the demo overlay. Panels, text and controls fit the observed desktop window. The Pole detail study clearly showed a lighter front face, dark side face and gold beveled cap with clipped corners. The study is an art fixture, not a successful gameplay or collision demonstration. A 75 shortcut run ended before the attempted pause; that attempt is not recorded as a pause pass.

## Remaining verification limits

No new physical iPhone/Android, mobile Safari, phone emulation, high-refresh or reduced-motion visual run in this pass. Chrome had been unavailable to the parent reviewer. The complete opening → vault → Surface → game → return journey through unmodified `/` has not been exercised for this redesign; the demo directly opens the game, so its Escape result does not prove real-page focus/scroll restoration. Human assessment of final-tier difficulty and actual device smoothness remains necessary before calling the redesign fully release-tested. Old unrelated hidden receipt text was visible in Safari accessibility output and remains outside this game change.
