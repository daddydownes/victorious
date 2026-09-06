# Gold Lift Surface release — September 6, 2026

User selected Surface demo3 and approved deployment after testing. During final QA user also asked to remove the circular top-right vault logo; its image element is removed, with the asset retained in Git.

## Change

Gold capsule with dark label,48px target, rising reflection and a280ms upward arrow/shine exit cue. Idle shine runs only in the open vault and stops after Surface. Reduced motion keeps static gold styling. Existing Surface choreography and touch cancellation remain intact. Fixed the keyboard scroll trap so Space activates the focused Surface button natively; all other vault background-scroll locks remain.

## Tests actually completed

- Eight full browser journeys observed in native macOS Chrome: four normal-motion layouts (1440×594 desktop,667×375 landscape,375×667 portrait,320×507 narrow actual viewport), then four consecutive reduced-motion narrow runs. Requested responsive height was568; actual browser measurement was507 and the record uses measured dimensions.
- All eight: no recorded runtime errors, button fully within viewport with48px height, exit focus on stage, vault hidden, rising state cleared, shimmer stopped, no horizontal overflow.
- Desktop journey activated Surface using Tab then Space; other journeys used the UI button. The fourth reduced-motion run also visually confirmed removal of the top-right circle.
- Surface input fixtures passed50 loops: stationary tap, pointer cancel/lost capture, drag, outside release, native Space exception, closing-state lock, Tab cycle and Escape. Existing reveal, press feedback and post-Surface scroll suites pass.
- Defined dark-label contrast:8.47:1 or better across base gradient endpoint/pressed colours.

These are eight total browser journeys, not four per viewport. Phone testing was Chrome emulation, not physical Safari/Android hardware. The entire historical TESTING.md browser matrix was not rerun. Existing unrelated issues stay tracked in STATUS.md. Local observation script was not added to production.

## Release verification

Publish the authorized change, verify Pages build and canonical homepage bytes, then run a live vault→Surface smoke test. Store the actual outcome in STATUS.md.
