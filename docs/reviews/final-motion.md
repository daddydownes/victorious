# Final motion and publication candidate

Built on 5978114. Play the game retains its exact artwork and stays fully painted; its light changes without moving the title. A small native-scroll-driven card entrance bridges from the film. Vault paint is preserved. Primary gold capsules, restart feedback and the two-line signup invitation have bounded animation. The repeated gallery wordmark is removed; six photos remain.

Validation commands and observed evidence:

- `node tests/final-motion.cjs <evidence-directory>`: seven Chromium/WebKit/Firefox desktop/phone configurations passed fast/reverse scroll, stable title geometry, advancing button highlights, game entry/exit and focus, partial vault paint, visible pressed labels and dynamic reduced motion. A labelled hidden-document fixture checks the visibility handler. Desktop and phone screenshots were inspected.
- `node tests/release-journey.cjs <evidence-directory>`: eleven visual configurations plus failed-art fallback passed. Native wheel distance remains unchanged, title/CTA alignment and six photos remain, no horizontal overflow or script errors.
- `node tests/release-handoff.cjs <evidence-directory>`: 32 return loops and 24 mocked signup cases passed before the final gallery-mark removal and per-control offscreen pause refinement. Form logic and navigation were unchanged afterward. No external signup transport.
- `node tests/release-ready.cjs <evidence-directory>`: three production-shaped origin audits and four complete journeys per Chromium desktop/WebKit phone configuration. Actual original film, vault entry, Surface, story film/replay, game start/death/retry/exit, vault return, browser Back/Forward and original restart. Final results are recorded in the local release evidence.
- `node tests/full-experience.cjs`: 16 integration/rebuild checks passed; the original game identity and 100-point reward remain.
- All ten mandatory root suites in WORKFLOW.md, `node tests/demo-server.cjs`, and `git diff --check` passed.

The first added motion harness was corrected to load lazy artwork after scrolling, use a fresh visit for the monotonic vault reveal, compare transformed heading text case-insensitively, and include pseudo-elements when reading animation time. A real offscreen-animation issue was corrected by observing the title and controls individually. These are browser-engine and fixture results, not physical Apple/Samsung/Pixel certification or a human game difficulty rating.

The user explicitly requested publication after checking. GitHub Pages remains main/root with vctrsclo.com and enforced HTTPS; origin/main was e972c19 at the pre-push check. Hosting and verification files, existing media and the immutable upstream source are preserved. Direct canonical retrieval was denied by the web reader in the previous readiness pass; local production-shaped origin checks do not establish live-domain byte parity. Final push/build evidence is kept with the release handoff.
