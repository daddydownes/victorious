# Flappy V release — September 6, 2026

The owner explicitly requested publication after approving the iterative preview. Source candidate: `77b3bd2`, superseding production `5f098d6`.

Includes fullscreen original atmosphere, four obstacle stages, minimal satin pillars, mandatory openings, precise shared collision geometry, soft death/fade/retry, and the original 100-point reward. Demo study and win controls are injected only by the local Python server and absent from production HTML.

All ten portable suites pass: reveal, scroll, press, Surface, difficulty, collision, material, lifecycle, death and reachability. Evidence includes 12,500 generated gates, 254 collision checks, 106 lifecycle cases, 12 death height/cadence cases and 12 full physics flights / 1,200 clears. Normal local Chrome entry through PRESS HERE, vault, Surface and PLAY THE GAME reaches the production game dialog. Prior Chrome stage studies and death/win previews are recorded in STATUS.

The complete TESTING.md four-pass matrix, physical iPhone, Windows, fresh Safari and full console/performance audit were not completed. These remain deferred to the next QA maintainer under the owner's explicit publication instruction; this is not a claim that the full release checklist passed. Existing unrelated site issues remain in STATUS. No real form submissions were made.

Publishing is a fast-forward of main, preserving history and production paths. Verify GitHub Pages build commit and exact live homepage bytes after push. Rollback reference is `5f098d6`; preserve subsequent commits with a revert rather than destructive history reset.

Deployment verified: `cf51ffcf08222271a54330144aeaa1b2b0d0acf0` reports `built` through GitHub Pages. The canonical HTTPS homepage is byte-identical to the approved index.html. Follow-up documentation does not alter production HTML.
