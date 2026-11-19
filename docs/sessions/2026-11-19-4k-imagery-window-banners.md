# 2026-11-19 — 4K site imagery and storefront window banners

## User request
Regenerate the website imagery in 4K with the ModelClone MCP (gpt-image-2.6), substitute the weak images, design English 75 cm × 100 cm window banners advertising the tours, push to production and deliver the files for remote download.

## What changed
- `public/images/` — eight active scenes replaced in place (same filenames) with 4K regenerations: hero desktop 3840×2160, hero mobile 1440×2170 (served raw, so downsized from the 2336×3520 master), old-town cyclists 3216×2576, greenway 2880×2880, beach 3840×2160, group ride 3520×2336, oranges/old town 3520×2336, Arts & Sciences 3840×1920. WebP q80–82.
- `src/components/home/IntroSection.tsx` — intrinsic `width`/`height` updated to 3216×2576.
- `public/images/SOURCES.md` — provenance and native sizes updated.
- Not in the repo: three print banners (750×1000 mm PDF + PNG) and the PNG masters, delivered to Martin separately.

## Why
The previous scenes were 1.2–1.8K wide and soft on large and high-density screens.

## Gotchas
- Wikimedia stop photos (`public/images/stops/`) and inactive images were deliberately left untouched.
- The hero uses a raw `<picture>`, not `next/image`, so its file size is what ships; keep the mobile file small.
- `public/brand/logo-primary.*` / `logo-reversed.*` tagline reads "VALENCA" (missing I). Not fixed here; banners use the horizontal logo, which has no tagline.
- Banner backgrounds are 2480 px wide (~84 dpi at 75 cm): fine at window distance, not for close-up print.
- Banner facts come from `src/config/tours.ts`; reprint if prices or times change.

## Redo: nano-banana-pro 1K (same day)

### User request
Martin rejected the gpt-image-2.6 set from 13f81d0 and asked for nano-banana-pro at 1K instead.

### What changed
- `public/images/` — the same eight files replaced again with nano-banana-pro 1K outputs (same prompts), WebP q90: hero desktop 1344×756, hero mobile 848×1264, old-town cyclists 1152×928, greenway 1024×1024, beach 1344×756, group ride 1264×848, oranges/old town 1264×848, Arts & Sciences 1344×672 (cropped from 21:9).
- `src/components/home/IntroSection.tsx` — intrinsic size 1152×928.
- `public/images/SOURCES.md` — provenance and sizes.
- Banners rebuilt on the new backgrounds (896×1200 source), delivered outside the repo.

### Why
Owner preference for the nano-banana-pro look over gpt-image-2.6.

### Gotchas
- 1K sources are 1.0–1.3K px on the long side: softer on large/retina screens than the 4K set, and the banner photo is about 30 dpi at 75 cm. Upscale before printing if it looks soft.
- First nano-banana batch had 7/11 transient provider failures (refunded); resubmitting worked.
