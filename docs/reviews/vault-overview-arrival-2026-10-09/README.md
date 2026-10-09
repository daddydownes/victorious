# Dates-to-overview arrival performance — October 9

Code commit: `9f8bf497658f4b1867c23dab85243ad978d7d04f`.

Baseline: published main `3fae18ef2125e1523d0193f064748cc97148c21a` (root SHA-256 `f896ab549553a2f121c1ea42264d98af1ae944e2c498467e58f2d240a630266d`). Candidate root SHA-256: `c3637f55406d4b3eb8a20bc26a827eccd222d96ede7cbd82cff2ccf6182c0520`.

The reported hitch is the transition from event dates/signup to the first complete bird’s-eye photo view, before the zoom. This is separate from PR #9’s cancellation and half-entry recovery.

## Changes and scope

- Start the existing `warm()` and `warmOverview()` during the covered approach to signup. Leave opening/collection idle loading unchanged and reuse the four-job loader, existing derivatives and readiness behavior.
- Stop assigning a changing `clip-path` to the fixed Vault each frame. The opaque collection/signup sections above it already mask the same region. Retain the fixed black Vault and identical photo-plane transforms.
- Keep original media, photo quality/composition, CSS, markup, transition timing, input controller, zoom, signup, Surface, game and hosting unchanged. Scope tests reconstruct the baseline root after substituting only the changed camera function and generated guide.

## Measured workload

Three fresh baseline and three candidate Chromium runs at 390×844, DPR 3 and 4× CPU slowdown. Static opening setup is followed by normal motion, consecutive signup and overview cue activation with no reading delay, and tracing of both phases. This is controlled local delivery, not a cellular-network or physical-iPhone benchmark. Signup transport is mocked.

| Measurement | Published baseline | Candidate |
| --- | ---: | ---: |
| Photos marked prepared before arrival, each run | 0, 0, 0 | 33, 33, 33 |
| Arrival ImageDecodeTask duration, median summed ms | 254.216 | 16.879 |
| Arrival Decode Image duration, median summed ms | 243.065 | 0 |
| Arrival RasterTask duration, median summed ms | 37.358 | 4.889 |
| Arrival Paint duration, median summed ms | 17.353 | 13.300 |
| Arrival FunctionCall duration, median summed ms | 32.004 | 14.462 |

Preparation moves earlier: median signup ImageDecodeTask increases from 0.006 to 279.988 summed ms. The candidate does not eliminate the total decoding cost or promise all images complete over a slow network. Summed trace tasks may overlap and are not elapsed transition duration. Both baseline and candidate already sampled near 60 FPS on this desktop: maximum moving-frame gap was about 17.7ms in both phases, with no gaps above 33.5ms. Consequently this supports lower work during reveal, **not a measured FPS increase or proof the owner’s physical iPhone hitch is eliminated**.

Compact trace summaries are [baseline-workload.json](baseline-workload.json) and [candidate-workload.json](candidate-workload.json). Reproduce with `tests/overview-arrival-profile.cjs`, `BASE_URL`, `EVIDENCE_DIR`, `QA_LABEL` and optional `QA_SOURCE_SHA256`; it writes full traces outside the repository.

## Interaction and composition verification

Twelve completed-original-hero browser journeys pass, four each in Chromium 390×844 (CDP native touch), WebKit 390×844 and WebKit 844×390 (wheel/keyboard). Each set covers normal input, reversal, spam and cancellation/resize, with mocked signup and no page errors. First journeys also cover Surface, game and return. See [journeys.json](journeys.json). These are browser-engine checks, not iOS Safari hardware tests.

`tests/vault-overview-arrival.cjs` passes 760 matching production-controller frame states, 32 matching camera transforms, covered preparation/idle/reversal cases and strict source scope. The 27 interrupted-entry regressions, image delivery/decode regression and required workflow source, Surface and game suites pass, including all 12 reachability courses (1,200 obstacle clears).

The visual harness compares the same settled frame with and without the former mask at four arrival offsets. Its static-only fixture freezes countdown wall-clock time, awaits displayed-image decoding and waits for identical consecutive screenshots; it does not alter the performance harness. Chromium phone, small phone, large phone, landscape and desktop comparisons are pixel-identical. WebKit portrait/landscape/reduced-motion comparisons permit one color level of photo compositing rounding, or at most three levels at the single physical-pixel fractional mask edge. Larger content/geometry differences fail. All 32 comparisons pass; see [visual.json](visual.json). Preliminary checks caught a changing countdown and an image still painting after `asset-ready`; those fixture problems were corrected rather than accepted as visual changes.

Physical iPhone Safari and embedded-browser confirmation remain outstanding. The owner’s exact device model has not yet been supplied. Publishing is verified separately through Pages build completion and canonical live source equality.
