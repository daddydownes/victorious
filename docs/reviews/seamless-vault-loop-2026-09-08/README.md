# Continuous Vault loop — September 8, 2026

Application source checkpoint `d87d449` replaces the old story invitation/gallery/signup tail with a spacious canonical gold V and a continuously revealed original Vault. Embedded Surface resets the same parent story; a different second Surface remains deferred. Actual gameplay paints every fifth pair; the preview retains paint on every pair.

## Checked behavior

- WebKit 1280×720: game Exit restores scroll/focus; wheel reveals a partial inert Vault; fully visible Vault supports pointer drag; two successive Surface loops reset parent scroll, focus and child cycle without navigating or nesting another story.
- WebKit 390×844 with reduced motion: keyboard scroll/reveal, arrow-key archive pan and Surface reset pass.
- Chromium 390×844 with touch/mobile emulation: CDP touch gestures scroll into the archive, pan it, and Surface resets the loop.
- No page errors in these journeys. Screenshots cover partial/full reveals.

The browser check caught a WebKit ancestor-scroll regression when the embedded document reloaded with `#vault`. The dedicated clone now enters the Vault through its embed query mode and reloads without a fragment. Repeated browser loops pass with that correction. Desktop archive input is deliberately drag/keyboard; wheel remains blocked there by the existing design.

See [results](results.json), [journey harness](journey.cjs), [desktop partial reveal](webkit-1280x720-partial-vault.png), [second desktop loop](webkit-1280x720-vault-active-2.png), [reduced-motion phone](webkit-390x844-reduced-active.png), and [touch phone](chromium-390x844-touch-active.png). Run the harness with Playwright installed and `DEMO_URL` pointing to the served repository.

These are browser-engine and emulation checks, not physical-device certification. Original media identity is checked separately by `tests/media-fidelity.cjs`; no photo, film or font was recompressed. Earlier Demo 02 and graffiti evidence retains its recorded scope.

## Hidden-work check

A one-second Chromium sample observed zero child animation-frame callbacks, zero running animations and no playing media while the Vault was inactive, both before and after activation. Activation resumed the original dust/decorative work; no unused hero-film request occurred. See [motion results](motion-smoke.json) and [probe](motion-smoke.cjs). This is a lifecycle check, not a rendering frame-rate benchmark.

## Release gates

Final test checkpoint `c64fa52`: full-experience 15/15 with deterministic five-output generation, V-style protected-source checks 15 functions across three game routes, material guards, 37/37 byte-exact media and all ten workflow root suites pass. The legacy reveal VM fixture was updated to match the already-published backdrop isolation and reveal watchdog; no application behavior changed for that test repair. Independent Astra review approved source, visuals, repeated loops and hidden-work evidence.
