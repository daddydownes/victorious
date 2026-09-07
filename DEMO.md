# VCTRS complete demo

On Windows, double-click **Start Demo.cmd** in this folder. Keep its terminal window open while viewing. Node.js is required; no packages need installing.

The complete demo starts at [the original entrance](http://127.0.0.1:59408/). The launcher reuses an existing server for this folder when it is already running.

From a terminal on any platform:

```sh
node tools/serve-demo.cjs
```

The journey is the original V and film → PRESS HERE / ENTER THE VAULT → draggable vault → Surface → V-and-star opening → expanding event video → spray-painted Play the game invitation and playable game → spray-painted Back to the vault invitation → six photos and signup. Enter the vault returns to the original archive. Start again restarts the original entrance. The removed memory passage stays removed.

The event video plays continuously from source second four to its end. Replay appears when it finishes. Reaching 100 in the game unlocks the 100 Club visual reveal.

Keep this entire folder together, including `assets`, `experience`, `film.mp4` and `tools`. Opening `index.html` directly as a file will not run the complete experience correctly.

This is a local demo of the saved candidate. GitHub and the public site are unchanged. The original signup integration remains present; local QA does not submit real email addresses. Video playback is suppressed when the device requests reduced motion.

To regenerate after editing the source snapshots or builder, run `node tools/build-experience.cjs`. Normal viewing does not need a rebuild. See [the review](docs/reviews/full-experience.md) for validation and device-testing limits.

The [release sprint review](docs/reviews/release-sprint.md) records paint, button and browser checks. `node tests/release-journey.cjs` runs the integrated browser matrix when Playwright and its browser engines are installed; all nonlocal requests are blocked. Physical-phone and shipping Safari checks remain separate.
