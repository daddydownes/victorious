# Current non-Flappy mobile/responsive audit

Target: live/current `46226be139353d81947499ec5552c52547d68011`; GitHub Pages and live `/`, `/experience/`, and `/experience/game-preview.html` were independently verified byte-identical to that commit. Local browser checks served the detached current worktree at the same SHA. The pre-existing `/Users/docs/Desktop/VCTRSCLO.COM/share-preview` checkout at `e972c19` is stale and was not used as the final baseline.

## Confirmed findings

1. **High — 540×360 Next Drop layout hides the entrance completely.** In Chromium and WebKit touch emulation, after the reveal lands, `.next-drop-card` is 540–541px tall inside a 360px locked viewport. The email row begins at y=349 and the `#nextVaultHold` target is y=441–516, leaving **0 visible pixels** of the entrance. `body.locked` and `.next-drop` both use `overflow:hidden`; document scroll height remains 360px, so scrolling cannot recover it. The compact `max-height:520px` rules begin only at `min-width:560px`, leaving 540px wide short screens in the uncompressed narrow-layout branch. Evidence: `evidence-short/results.json`, `evidence-short/chromium-540x360-invitation.png`, `evidence-short/webkit-540x360-invitation.png`. Current source anchors: `index.html:62`, `633`, `641`, `782-803`.

2. **High — reduced-motion keyboard focus enters controls hidden behind the fixed Next Drop screen.** Fresh 320×568 reduced-motion load: Chromium tabs through the three visible controls, then focuses legacy `#signupEmail`, its submit button, and `#vaultHold`; WebKit's second focus stop is already `#signupEmail`. Focus produces no visible indication because the fixed Next Drop screen covers those legacy controls. `seamApply(seamGapMax())` clears `#seamGold.inert` during reduced-motion initialization. Evidence: `evidence-focus/results.json`, `evidence-focus/chromium-reduce-after-tabs.png`, `evidence-focus/webkit-reduce-after-tabs.png`. Current source anchors: `index.html:1669-1685`, `1735-1737`, `2193`.

3. **Medium accessibility risk — the landed Vault leaves background regions exposed to assistive browse navigation.** At the current 320×568 landed Vault, DOM metrics still find `#stage` as a visible 320×568 `role=region` behind the opaque fixed Vault; it has no `inert` or `aria-hidden`. This creates a risk that screen-reader browse navigation can reach stale journey content even though keyboard focus is trapped. The same state is visible in `evidence-responsive/results.json` under `homepage.chromium-320x568.vault.controls`. A screen-reader browse escape was not exercised, so its impact remains unverified. Current source anchors: `index.html:764` (hides stage only while `next-drop-landed` applies), stage markup around `index.html:850`, Vault markup around `index.html:1001`.

4. **Medium accessibility — a success receipt exists in the accessibility content before any submission.** On every fresh-load focus run, `#seamRcv` contains `RECEIVED. THE VAULT HAS IT.`, has `aria-live=polite`, has no `aria-hidden`, and is hidden only with opacity 0. Screen-reader text navigation can encounter a false success state. This audit does not establish automatic announcement on load. Evidence: `evidence-focus/results.json`. Current source: `index.html:968`.

5. **Medium accessibility — reduced-motion disables pinch zoom inside the Vault.** `.vault` uses `touch-action:none`; `nativeVaultPreference()` explicitly returns false under reduced motion, so the native `pan-x pan-y pinch-zoom` mode is never applied for those users. This was source-confirmed at the current SHA, without a physical multi-touch device. Current source: `index.html:488-490`, `1063-1070`.

6. **Medium accessibility — sixteen meaningful Vault photographs have generic alternatives.** Current rendering assigns `VCTRS archive piece 1` through `16`; only the final DJ photo gets a descriptive alternative. The gallery therefore does not communicate most photo subjects to screen-reader users. Current source: `index.html:2613-2619`.

## Verified responsive behavior

- No horizontal document overflow, page errors, or primary-control clipping was found on `/experience/` in Chromium 320×568, 390×844, and 1440×900; WebKit 390×844 and 844×390; or Chromium 320×568 reduced motion.
- Main `/` invitation and fully landed Vault were visually usable without horizontal overflow at Chromium 320×568/390×844 and WebKit 390×844/844×390. Primary visible controls were 48px or taller in portrait; the 844×390 email row was 40px tall but had ample separation and remained usable, so it is not reported as a standalone defect.
- Reduced-motion `/experience/` settles the story layouts, removes the film, keeps the copy and controls readable, and shows a static game preview.
- Repository `release-ready` checks passed the Chromium 1280×720 and WebKit 390×844 production-origin stages; the suite stopped when its optional Firefox binary was absent. No Firefox installation was attempted.

## Evidence limits

The screenshots use headless Chromium/WebKit viewport and touch emulation against a local server at the exact live SHA. They are not physical iPhone, Android, browser-chrome safe-area, screen-reader, or multi-touch tests. No forms were submitted and no production state was changed.
