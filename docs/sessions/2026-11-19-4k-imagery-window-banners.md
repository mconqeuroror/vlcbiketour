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
