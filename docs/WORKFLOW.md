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

On Windows the equivalent may be `py -m http.server 8921 --bind 127.0.0.1`. Open http://127.0.0.1:8921/ and use a fresh query string for repeated-load checks.

## Validation

With Node.js installed:

```sh
node tests/reveal.cjs
node tests/post-surface-scroll.cjs
git diff --check
```

The tests extract the actual relevant handlers from `index.html`, use a mocked browser environment, and never contact FormSubmit. The scroll comparison reads the pre-retune `f5b625e` source from Git history; use a full clone (or fetch full history) if the test cannot find it. They do not prove rendered smoothness or physical touch behavior.

Use `TESTING.md` for visual/interaction changes and its four-pass journeys. Record exactly which desktop, phone emulation, physical devices and motion settings were used. If a required environment is unavailable, state the gap; do not call it tested. Check the changed path plus related entry/exit/focus paths. Mock email success/failure/timeout instead of submitting real addresses during routine QA.

The historical Safari/WebKit report remains unchanged as evidence for its specific commit. Its hold-based journey is historical; the current primary button is tap/click PRESS HERE.

## Publish an authorized change

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
