import { test, expect } from "@playwright/test";
import { GUIDE_SLUGS } from "./helpers";

// SITE_URL comes from .env (http://localhost:3000 in this checkout) — we assert
// the localized path + trailing slash and treat the host as configuration.
async function headLinks(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const canonical =
      document
        .querySelector('link[rel="canonical"]')
        ?.getAttribute("href") ?? null;
    const alternates = Array.from(
      document.querySelectorAll('link[rel="alternate"][hreflang]'),
    ).map((el) => ({
      hreflang: el.getAttribute("hreflang"),
      href: el.getAttribute("href"),
    }));
    return { canonical, alternates };
  });
}

test.describe("3. Canonical + hreflang", () => {
  const samples: { en: string; es: string }[] = [
    { en: "/en/", es: "/es/" },
    { en: "/en/valencia-group-bike-tour/", es: "/es/tour-bicicleta-valencia-grupos/" },
    { en: "/en/book/", es: "/es/reservar/" },
    {
      en: `/en/guides/${GUIDE_SLUGS["group-bike-tour-planning"].en}/`,
      es: `/es/guias/${GUIDE_SLUGS["group-bike-tour-planning"].es}/`,
    },
  ];

  for (const pair of samples) {
    test(`canonical/hreflang reciprocal on ${pair.en} ↔ ${pair.es}`, async ({
      page,
    }) => {
      const results: Record<string, { canonical: string | null; alternates: { hreflang: string | null; href: string | null }[] }> = {};
      for (const path of [pair.en, pair.es]) {
        await page.goto(path);
        results[path] = await headLinks(page);
      }
      for (const [path, meta] of Object.entries(results)) {
        expect(
          meta.canonical?.endsWith(path),
          `canonical on ${path} (got ${meta.canonical})`,
        ).toBe(true);
        const hreflangs = meta.alternates.map((a) => a.hreflang);
        expect(hreflangs).toContain("en");
        expect(hreflangs).toContain("es");
        expect(hreflangs).toContain("x-default");
        const byLang = Object.fromEntries(
          meta.alternates.map((a) => [a.hreflang, a.href]),
        );
        expect(byLang["en"]?.endsWith(pair.en), `hreflang en on ${path}`).toBe(true);
        expect(byLang["es"]?.endsWith(pair.es), `hreflang es on ${path}`).toBe(true);
        expect(byLang["x-default"]?.endsWith(pair.en), `x-default on ${path}`).toBe(
          true,
        );
      }
      // reciprocity: both pages point at the same pair of URLs
      expect(results[pair.en].alternates).toEqual(results[pair.es].alternates);
    });
  }
});

test.describe("4. sitemap.xml + robots.txt", () => {
  test("sitemap.xml contains only canonical localized URLs with trailing slashes", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    const locs = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(0);
    for (const loc of locs) {
      expect(loc, loc).toMatch(/^https?:\/\/[^/]+\/(en|es)\//);
      expect(loc.endsWith("/"), `trailing slash: ${loc}`).toBe(true);
    }
    // both guide articles present in both locales
    for (const pair of Object.values(GUIDE_SLUGS)) {
      expect(xml).toContain(`/en/guides/${pair.en}/`);
      expect(xml).toContain(`/es/guias/${pair.es}/`);
    }
    // key pages present
    expect(xml).toContain("/es/tour-bicicleta-valencia-grupos/");
    expect(xml).toContain("/es/condiciones-de-reserva/");
    // no non-localized or API URLs
    expect(locs.some((l) => l.includes("/api/"))).toBe(false);
  });

  test("robots.txt allows /, disallows /api/, references sitemap", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toMatch(/Allow:\s*\//i);
    expect(body).toMatch(/Disallow:\s*\/api\//i);
    expect(body).toMatch(/Sitemap:\s*\S+sitemap\.xml/i);
  });
});
