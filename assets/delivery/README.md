# Conservative performance delivery candidate

Local candidate based on production `b7380e2206632c4a5c223870321a8f0b13ad39e1`. All existing source media are retained byte for byte. This directory contains separate delivery copies, not replacements for masters.

- `opening-1080.mp4`: complete 1920×1080, 30fps, 112-frame opening, H.264 CRF20/slow, one-second keyframe interval, fast-start MP4. Original AAC stream copied unchanged. 2,224,915 bytes; source 5,815,149 bytes.
- `surface-720.mp4`: complete 1280×720, 30fps, 745-frame Surface edit, H.264 CRF22/slow, one-second keyframe interval, fast-start MP4. Source is silent; no audio removed. 8,783,605 bytes; source 12,107,918 bytes.
- Photo variants: WebP quality92, Lanczos width640/1280, never upscaled beyond source width. The runtime chooses by tile width, current plane scale and device pixel ratio. It keeps originals for demand beyond1280px, and upgrades after viewport changes. Existing composition/crop geometry is unchanged.
- `fredoka-variable.woff2`: lossless WOFF2 conversion of `assets/fonts/fredoka-variable.ttf`, preserving variable axes and glyphs; 86,224 bytes rather than159,184. FontTools4.65.0/Brotli1.2.0 were already available on the build host. To regenerate with those dependencies: load the TTF using `fontTools.ttLib.TTFont`, set `flavor='woff2'`, save here. The OFL license remains with the original.
- `surface-poster.webp`: quality90 copy of the existing embedded1280×720 JPEG poster. Its separate URL and lazy loading remove that payload from the opening document; it remains the same scene.
- `game-preview.html`: generated verbatim from `tools/guided/game-preview.html` by the normal `tools/build-guided.cjs` builder. It is fetched on Surface, and still only animates when its section is active.

Run `node tools/build-delivery.cjs` to reproduce video/photo derivatives with FFmpeg9.0. Run `node tools/build-guided.cjs` after journey edits. Exact bytes can vary with encoder versions, so a regenerated file needs a fresh visual review and measured check. Current full-film SSIM against originals: opening0.996015, Surface0.994247. These are numerical reference comparisons, not claims of pixel identity or perceptual equivalence.

The owner prioritizes keeping the same look and feel. Stronger experimental encodes were excluded from this candidate. No adaptive codec ladder, automatic scene skipping or content removal is part of this change. After reviewing the comparison, the owner approved publishing the conservative candidate to the existing domain.
