# Preliminary branch — not approved for deployment

This branch was assembled by run `36310068072`, whose shell pipeline incorrectly reported the landscape job as successful after an assertion failed. The `20 ... journeys` statement generated in this branch's status entry is therefore not valid evidence. This branch has not been approved or published.

The application candidate hash is unchanged, but navigation touch targeting and the verification pipeline are being corrected on `perf/cross-browser-20260927`. The replacement run `36310476018` uses Bash pipefail, checks the actual delivered touch target, and validates all result JSON rows. Its clean output branch is `perf/cross-browser-verified-20260927`, based on the newer `5cd5114` documentation commit. Use that branch only after its full verification succeeds and its diff is reviewed.

The test failure occurred when Chromium delivered a near-form emulated touch to the email input, which intentionally protects editing gestures. Do not weaken the application input guard to make navigation tests pass. See the preserved production note `docs/reviews/receipt-event-trace-2026-09-27.md` on main.
