# VCTRS — Victorious

The source for **https://vctrsclo.com**, a Canberra clothing brand's interactive website. The current journey keeps the original V opening and email capture, enters the Vault, then surfaces into a focused film/story, interactive game preview, full game and Refresh website. It stays in one document and URL.

This is a static website served by GitHub Pages from main at the repository root. Edit the guided source in `tools/guided/` and run `node tools/build-guided.cjs`; the prepared `index.html` needs no runtime build or installation. Existing `experience/` and demo routes are retained. Their older generator can overwrite the current root, so follow the [working guide](docs/WORKFLOW.md). See [current status](docs/STATUS.md) and [September 9 release evidence](docs/reviews/guided-world-2026-09-09/README.md).

## Start here

| You need | Read |
| --- | --- |
| Instructions for a coding agent on any device | [AGENTS.md](AGENTS.md) |
| Current design, latest work and outstanding bugs | [Current status](docs/STATUS.md) |
| How the whole site works and where to edit | [Architecture map](docs/ARCHITECTURE.md) |
| Local setup, testing, publishing and recovery | [Working guide](docs/WORKFLOW.md) |
| Why recent choices were made | [Decisions and change history](docs/DECISIONS.md) |
| Full visual release checklist | [TESTING.md](TESTING.md) |

## Run locally

For the complete integrated demo, double-click **Start Demo.cmd** on Windows, or run `node tools/serve-demo.cjs`. Open http://127.0.0.1:59408/ at the original entrance. See [the demo guide](DEMO.md) for its full journey and reopening instructions. The accepted story, video and game are already generated; no dependency installation is needed.

From the repository root, with Python 3 installed:

```sh
python3 -m http.server 8921 --bind 127.0.0.1
```

Open http://127.0.0.1:8921/. With Node.js installed, run the focused, offline regression checks:

```sh
node tests/reveal.cjs
node tests/post-surface-scroll.cjs
node tests/press-feedback.cjs
node tests/surface-input.cjs
```

These checks do not submit email or replace browser/device testing.

## Repository layout

- `index.html`: live application, including embedded CSS and JavaScript.
- `tools/guided/`: editable source for the current post-Surface homepage journey.
- `experience/`: preserved historical story/game route and assets.
- `assets/`, `film.mp4`, `vctrs-wordmark.svg`, `og.jpg`: production media and artwork.
- `CNAME`, `.nojekyll`, `google303d59fed389923f.html`: hosting and search ownership files; preserve them.
- `docs/`: portable project knowledge and handoff.
- `tests/`: portable regression checks.
- Root `*demo*.html` files: existing visual experiments, not the production homepage. Kept at their original URLs.
- `QA-SAFARI-WEBKIT-2026-09-04.md`: historical results for its stated commit, not a current all-clear or current failure report.

Nothing was deleted or moved during this documentation cleanup. Update the linked guides with future changes so a new session does not have to reconstruct the project from chat history.
