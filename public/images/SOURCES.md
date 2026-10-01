# Image sources — biketourvlc.com

All photography on the site comes from the approved Bike Tour VLC design kit
(biketourvlc-design-kit, `public/images/`). Per the kit's
`design/asset-manifest.json`, these are **native-resolution concept crops from
generated brand boards** — NOT authentic operator photography, possibly
geographically or anatomically inaccurate, and every one is flagged
`productionReplacementRequired: true`. They must never be presented as
documenting a real customer tour, and people visible in them are not customers
or guides.

## In use

| File | Used for | Native size | Status |
|---|---|---|---|
| hero-cyclists-concept.webp | Homepage hero | 620×332 | temp — replace ≥2400px wide + art-directed mobile crop |
| old-town-cyclists.webp | Homepage intro split | 209×169 | temp — replace ≥1200px |
| greenway-cyclists.webp | Homepage editorial pair; tour stop (Turia Gardens) | 165×157 | temp — replace ≥1200px |
| beach-day.webp | Homepage coastal band | 252×115 | temp — replace ≥1200px |
| arts-and-sciences.webp | Tour stop (City of Arts and Sciences) | **1817×866 (full-res supplied 2026-10-01, PNG master kept as arts-and-sciences.png)** | AI-generated illustration per kit manifest — not documentary photography |
| oranges-old-town.webp | Tour stop (La Lonja area) | 166×81 | temp — replace ≥1200px |
| group-ride.webp | Tour stop (Central Market area); about page | 166×70 | temp — replace ≥1200px |
| hero-cyclists-panorama.webp | Tour page hero band | 471×115 | temp strip — replace ≥2400px |

## Full-res replacements still missing (8 of 9)

The 2026-10-01 full-quality package was partial (1 of 9). When supplied, drop
the full-size files in using these target stems and update the code references
(or rename to the current filenames):

| Target stem | Slot currently using temp crop |
|---|---|
| home-hero-primary--cyclists-panorama | homepage hero (hero-cyclists-concept.webp) |
| home-hero-alternative--old-town-cyclists | hero alternative (unused) |
| home-about-left--old-town-cyclists | intro split (old-town-cyclists.webp) |
| home-editorial-left--greenway-cyclists | editorial pair (greenway-cyclists.webp) |
| home-coastal-band--beach-day | coastal band (beach-day.webp) |
| groups-page-banner--group-ride | tour stop / about (group-ride.webp) |
| tour-nature-beach-gallery--beach-sunset | spare (beach-sunset.webp) |
| city-highlights-gallery--oranges-old-town | tour stop (oranges-old-town.webp) |

Per the package notes: hero variants are alternatives, not two sections;
gallery placements are suggestions, not new homepage sections.

## Not used on the site

beach-sunset.webp and the `.png` duplicates of the above are kept as spares.
`reference/hero-*-with-text-reference-only.png` files in the design kit contain
baked-in text and must never be used as production imagery.

## Brand assets

`public/brand/` (logos, favicons, app icons) and `public/icons/` (stroke icon
set) are from the approved design kit: vector reconstructions of the approved
artwork. Do not replace with generic bicycle/map-pin glyphs.

## Replacement rules (per the kit handoff)

Replacement hero: ≥2400px wide, separate art-directed mobile crop, natural
anatomy, true-to-location Valencia landmarks, no baked-in text/logos. Section
photos: ≥1200px on the long edge. Record source, usage rights and approval
status here for every replacement.
