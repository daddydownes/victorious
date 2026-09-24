# Working on any device

## Start a session

Clone `https://github.com/daddydownes/victorious.git` if needed. From the repository root:

```sh
git status --short
git fetch origin
```

Read `AGENTS.md` and `docs/STATUS.md`. Start a task branch from the latest `origin/main` in a clean checkout, or a separate worktree if another session is editing. Never reset away someone else’s work. No dependency install/build is needed.

Run a local server:

```sh
python3 -m http.server 8921 --bind 127.0.0.1
```

On Windows use the full path to an installed Python executable, or `node tools/serve-demo.cjs` on port 59408. Open http://127.0.0.1:8921/ and use a fresh query string for repeated-load checks.

## Rebuild the current homepage

Edit `tools/guided/` and run `node tools/build-guided.cjs`. The generated `index.html` is committed and serves directly without an install. The old `tools/build-experience.cjs` can overwrite the root; use it only for deliberate historical-route work in an isolated checkout.

## Validation

With Node.js installed:

```sh
node tests/guided-source.cjs
node tests/reveal.cjs
node tests/post-surface-scroll.cjs
node tests/press-feedback.cjs
node tests/surface-input.cjs
node tests/surface-recovery.cjs
node tests/flappy-difficulty.cjs
node tests/flappy-collision.cjs
node tests/flappy-material.cjs
node tests/flappy-lifecycle.cjs
node tests/flappy-death.cjs
node tests/flappy-reachability.cjs
git diff --check
```

The tests extract the actual relevant handlers from `index.html`, use a mocked browser environment, and never contact FormSubmit. The guided root runs `tests/guided-scroll.cjs` through the scroll entry point. The historical scroll comparison reads the pre-retune `f5b625e` source from Git history; use a full clone (or fetch full history) if the test cannot find it. They do not prove rendered smoothness or physical touch behavior.

For the guided pre-Vault input controller, run `node tests/entry-scroll-scope.cjs` to compare preserved markup, media, archive and downstream controllers with the production baseline. With Playwright installed, set `BASE_URL` to the verified explicit-root preview and `EVIDENCE_DIR` outside the checkout, then run `node tests/entry-scroll-browser.cjs`. Its default matrix repeats four real-input journeys at 390×844, 320×568, 844×390 and 1440×900: normal, accumulated reversal, repeated swipes/wheel, and cancellation/resize. It waits for completed hero playback, mocks signup transport, verifies overview/zoom handoff once, and follows Surface into the existing game and back. `QA_CASE`, `QA_PASSES`, `QA_PATTERN` and `QA_SOURCE_SHA256` support focused repeats and enforce a frozen candidate. Additional reduced-motion and engine cases are available; report codec/browser limitations separately from completed journeys. The signup viewport test now enters through Page Down, since programmatic scrolling alone intentionally does not authorize Vault entry.

Use `TESTING.md` for visual/interaction changes and its four-pass journeys. Record exactly which desktop, phone emulation, physical devices and motion settings were used. If a required environment is unavailable, state the gap; do not call it tested. Check the changed path plus related entry/exit/focus paths. Mock email success/failure/timeout instead of submitting real addresses during routine QA.

The historical Safari/WebKit report remains unchanged as evidence for its specific commit. Its hold-based journey is historical; the current primary button is tap/click PRESS HERE.

For the current collection and fade, run node tests/vault-fade.cjs. With Playwright installed, BASE_URL set to the verified preview, and EVIDENCE_DIR outside the checkout, tests/gallery-layout-browser.cjs covers responsive geometry and the scroll cue; tests/gallery-release-browser.cjs runs four complete journeys per browser/viewport configuration. The legacy vault-through-browser.cjs command forwards to this current suite. The former expanding logo is intentionally retired. tests/collection-rebound-browser.cjs checks both-direction wheel snapping, the matching end rebound, the pure-black backdrop and absence of decorative layers, pointer-hold stability with a mocked JOIN, and subsequent Vault entry in three engines.

## Publish an authorized change

For signup keyboard layout, run `tests/signup-viewport-browser.cjs` and `tests/signup-pointer-browser.cjs` with Playwright installed, `BASE_URL` set to the verified explicit-root preview, and `EVIDENCE_DIR` outside the checkout. The harnesses drive controlled VisualViewport signals, ordinary layout resizing and viewport recovery between pointerdown and pointerup; they mock every FormSubmit request. Record physical-device and embedded-browser checks separately from these engine tests.

GitHub Pages is configured for `main`, root. Publishing a commit to main is a production action; apply the user’s current authorization and check the diff first. Documentation-only commits also trigger Pages, although they do not change the homepage.

```sh
git diff --check
git diff --stat
git fetch origin
```

Check for intervening remote changes. Commit only the intended files. Use a reviewed PR, or when direct publication is authorized, push your task HEAD to `main` without force:

```sh
git push origin HEAD:main
```

If rejected, integrate/review the upstream changes; never force past them. With authenticated GitHub CLI, inspect the Pages result:

```sh
gh api repos/daddydownes/victorious/pages/builds/latest --jq '{status:.status,commit:.commit}'
```

Then verify the canonical live response against the intended local page:

```sh
python3 -c "from pathlib import Path; from urllib.request import urlopen; assert urlopen('https://vctrsclo.com/').read() == Path('index.html').read_bytes(); print('Live homepage matches')"
```

Build completion and caches can take time; a successful push alone does not verify deployment. For media changes, compare the affected live resource too. Do not remove `CNAME`, `.nojekyll`, or the Google verification file.

## Recovery and handoff

For an unwanted release, identify the exact commit and use a reviewed `git revert` to preserve history. Avoid hard resets or force pushes of main. Retest the affected behavior and publish within the user’s authorization.

Before stopping, update `docs/STATUS.md` with the code commit, outcome, tests, gaps and next task. Record durable reasons in `docs/DECISIONS.md`. Keep secrets, signup addresses and personal account information out of the repository. A new agent should be able to start from the GitHub README without the original computer or chat history.
