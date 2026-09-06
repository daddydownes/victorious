# VCTRS — Victorious

The source for **https://vctrsclo.com**, a Canberra clothing brand’s interactive website: opening V and film → drop invitation → draggable photo vault → Surface → crew, signup and Flappy-V game.

This is a static website. The production page, styles and JavaScript are in `index.html`; there is no package install or build step. GitHub Pages serves the repository’s `main` branch from its root.

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

From the repository root, with Python 3 installed:

```sh
python3 -m http.server 8921 --bind 127.0.0.1
```

Open http://127.0.0.1:8921/. With Node.js installed, run the focused, offline regression checks:

```sh
node tests/reveal.cjs
node tests/post-surface-scroll.cjs
```

These checks do not submit email or replace browser/device testing.

## Repository layout

- `index.html`: live application, including embedded CSS and JavaScript.
- `assets/`, `film.mp4`, `vctrs-wordmark.svg`, `og.jpg`: production media and artwork.
- `CNAME`, `.nojekyll`, `google303d59fed389923f.html`: hosting and search ownership files; preserve them.
- `docs/`: portable project knowledge and handoff.
- `tests/`: portable regression checks.
- Root `*demo*.html` files: existing visual experiments, not the production homepage. Kept at their original URLs.
- `QA-SAFARI-WEBKIT-2026-09-04.md`: historical results for its stated commit, not a current all-clear or current failure report.

Nothing was deleted or moved during this documentation cleanup. Update the linked guides with future changes so a new session does not have to reconstruct the project from chat history.
