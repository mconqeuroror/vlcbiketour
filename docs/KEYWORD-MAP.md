# Keyword map — Bike Tour VLC

One page per intent. No keyword is targeted by two pages; no page is built for an intent we do not serve. No search volumes or forecasts are claimed — priorities below are qualitative.

## English

| Intent / seed query | Page | Rationale |
|---|---|---|
| Brand: "Bike Tour VLC" | `/en/` | Homepage carries the brand name and the broad service statement. |
| "guided bike tours Valencia" (general service) | `/en/` | General commercial intent, not tied to one specific product. |
| "Valencia group bike tour", "bike tours Valencia for groups", "group bike tour Valencia" (transactional, this product) | `/en/valencia-group-bike-tour/` | The single product page owns the transactional group-tour intent. |
| "book bike tour Valencia for a group" (action) | `/en/book/` | Booking request page; not a ranking target, supports conversion. |
| "getting around Valencia by bike", "cycling in Valencia guide" (informational) | `/en/guides/getting-around-valencia-by-bike/` | Informational; links into the tour page. |
| "how to plan a group bike tour in Valencia" (informational, group-specific) | `/en/guides/how-to-plan-a-group-bike-tour-in-valencia/` | Informational; natural funnel into `/en/book/`. |
| "about / who runs the tours" | `/en/about/` | Trust page, not a keyword target. |
| FAQ-type questions (group size, price, weather, languages) | `/en/faq/` | Owned by the FAQ page; also eligible for FAQ-style snippets. |

## Español

| Intent / seed query | Page | Rationale |
|---|---|---|
| "tours en bicicleta por Valencia" (general service) | `/es/` | Homepage owns the general ES service intent. |
| "tours guiados en bicicleta en Valencia", "tour en bici para grupos Valencia" (transactional) | `/es/tour-bicicleta-valencia-grupos/` | Product page owns the transactional group-tour intent. |
| "rutas guiadas en bici para grupos en Valencia" (informational/planning) | `/es/guias/` and `/es/guias/como-organizar-un-tour-en-bici-para-grupos-en-valencia/` | Planning intent is informational; served by the guides hub and the planning article. |
| "moverse por Valencia en bicicleta" (informational) | `/es/guias/moverse-por-valencia-en-bicicleta/` | Matches the article topic exactly. |
| "reservar tour en bici Valencia" (action) | `/es/reservar/` | Conversion support, not a ranking target. |
| Preguntas frecuentes (precio, tamaño de grupo, clima) | `/es/preguntas-frecuentes/` | FAQ page owns question intent. |

## Explicitly NOT targeted

- "Private bike tour Valencia" / "tour privado en bici": departures may be shared between groups (`operator.toursArePrivate === false`). We do not claim exclusivity.
- "E-bike tour Valencia" / "tour en bici eléctrica": only standard city bikes are listed as included equipment.
- Individual seats / "join a bike tour": the product is groups of 5–20 only.
- Bike rental without a guide: not offered.

## Cannibalization rules

- The homepage links to the tour page with descriptive anchor text ("the group bike tour" style), never competing with its own transactional phrasing in titles.
- Guide articles link to the tour page and booking page; they do not repeat the tour page's title phrasing.
- EN and ES pages are hreflang alternates, not competitors — never cross-link one locale as canonical to the other.
