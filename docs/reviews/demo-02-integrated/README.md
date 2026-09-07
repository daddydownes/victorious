# Demo 02 motion and rounded paint — September 8, 2026

Local demo branch: `demo/v-style-20260908`. Final application fix: `d954f2d`; final test checkpoint: `d591d47`. No push or deployment. The review URL is http://127.0.0.1:8922/experience/#play while the local server runs.

The [supplied handoff](../../references/vctrs-demo-02-motion-handoff.md) is integrated into the real playable story game. The card arrives once over 980ms after a 90ms delay and relevant artwork decoding. Fully painted lettering remains stationary; title and arrow motion is bounded. Entry reveals the full-size canvas from the card clip over 560ms; return takes 430ms. Early Escape reverses from the sampled in-flight clip. Focus, scroll, inert background, resize, reduced motion and hidden-page settlement are coordinated, including input guards during closing. Real Vault navigation remains functional.

The two title SVGs, arrow and canvas gate paint have connected rounded droplet bulbs. Exact gold, canonical V/star, physics, collision polygons, 25-clear playable progression, ten-clear preview and original HD media are preserved.

## Verification

- [Chromium motion](chromium-motion.json): 12/12 cases, zero page errors; decoded arrival, real start/flap, precise early-Escape reversal, repeat entry, resize/reduced/hidden settlement, closing input guards and responsive geometry.
- [WebKit gameplay](webkit-game.json): 3/3 touch journeys at 320×568, 390×844 and 844×390, including pause/resume, natural death, retry and exit focus return.
- [WebKit title and motion](webkit-motion.json): 6/6, including title decoding/layout, early cancellation, reduced motion and rotation during entry.
- Static integration 16/16; canonical/game/vector invariants pass; all 37 original media files byte-identical; material clipping checks pass.
- Native Safari normal and quick-exit smoke checks passed. Independent Astra source and visual review approved this local demo.

[Desktop entry](desktop-entry.png), [phone lettering](phone-play.png), [Vault lettering](phone-vault.png), [active game](phone-game.png).

These are bounded local-demo checks. Automated browsers use emulated viewports; hidden state is injected in the Chromium lifecycle fixture. Stage-25 gameplay images are seeded visual witnesses. This is not physical-device certification, a human difficulty assessment or a production release pass. Earlier steady-play timing evidence applies to its recorded version; no new universal frame-rate claim is made.
