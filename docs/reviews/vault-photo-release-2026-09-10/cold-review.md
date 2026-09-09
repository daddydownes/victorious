# Cold release source review
Reviewer: baseline_review; primary retained sole write ownership.
Initial observed defect: historical photo rebuild required HEAD equal the old deployed revision, so a release commit broke its documented command.
Correction: normal guided builder remains the ongoing workflow; historical regeneration requires explicit recreation flag after the pinned revision. Comparison baseline is ignored and excluded from release.
Independent follow-up: PASS. Actual guided builder preserves32 photos, height table, plane and navigation reset; simulated post-release HEAD rejects unflagged replacement and permits explicit recreation; git ignore and diff checks pass.
Other observed checks:32 exact-case JPEG paths (11,313,943 bytes), guided-source, spatial layout, decode queue,16 navigation lifecycle checks, media/intro/input/signup/domain/indexing preservation.
Limits: source and deterministic checks only; primary owns separate browser and deployment evidence.
