# Three Surface button studies

Design demos only; the production Surface button and exit choreography are unchanged.

Open `index.html` directly, or serve this repository and visit `/demos/surface-buttons/`. Three options: Ascend (dark control, floating arrow), Halo (gold orb, orbit and release pulse), Gold Lift (solid gold capsule, upward reflection). Each has idle/hover/press styling and a short simulated scene rise. Replay-all, slow-motion and reduced-motion controls make comparison easier. Native system reduced motion always takes precedence.

All images are existing repository assets embedded by `build.py` for a portable standalone preview. Edit `template.html`, then run `python3 demos/surface-buttons/build.py`. No production code changes are included.

Validation: JavaScript syntax checked. Native desktop Chrome visually reviewed; all-three slow replay and reduced-motion static feedback exercised, normal motion restored. Mobile CSS stacks the studies; physical-device checks and actual Surface integration remain for whichever option the user selects. The demo animation is illustrative, not the live exit state machine.
