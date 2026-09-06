# Agent starting guide

## Read before editing

1. Read `docs/STATUS.md` for the latest state, known issues and next work.
2. Read the relevant section of `docs/ARCHITECTURE.md` to locate the feature.
3. Use `docs/WORKFLOW.md` for local testing and deployment. Consult `docs/DECISIONS.md` before reversing an intentional design choice.

Docs are a map, not a substitute for inspecting the affected implementation. Check the current branch, working tree and remote before making changes. Preserve other sessions’ uncommitted work. Use separate branches/worktrees for simultaneous editing; only one agent should drive a shared browser.

## Product constraints

- Preserve the approved opening V/star share artwork and evergreen metadata unless the user requests a change.
- The main invitation is **PRESS HERE / ENTER THE VAULT**, activated by tap, click or keyboard. Do not restore a hold requirement from old tests or the legacy `vaultHold` implementation.
- Button lighting repeats twice per logo cycle; keep their timing synchronized and honor reduced motion.
- Desktop wheel scrolling and phone touch scrolling have deliberately different tuning. Do not change both when asked to change only one.
- Keep vault entry, Surface, focus and animation cancellation coordinated. Late callbacks must not overwrite a newer state.
- Preserve hosting, verification files, existing demos, assets and Git history. Do not reorganize production paths just for tidiness.
- Routine form QA must mock transport; do not send real signup requests without explicit authorization.

## Keep the handoff portable

After meaningful work, update `docs/STATUS.md` with what changed, what was actually tested, remaining issues and the next task. Add meaningful product decisions to `docs/DECISIONS.md`; update the architecture map when structure changes. Include commit references and repository-relative paths, not machine-specific paths or private chat/account details. Do not store credentials or personal form data in these docs.

Do not claim a Google snippet has updated merely because metadata was deployed. Do not describe emulation or isolated tests as physical-device testing. Historical QA reports apply to their recorded commits.
