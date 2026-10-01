import { test, expect, type Page } from "@playwright/test";

async function jsonLdBlocks(page: Page): Promise<Record<string, unknown>[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(
      (el) => JSON.parse(el.textContent ?? "{}") as Record<string, unknown>,
    ),
  );
}

function types(blocks: Record<string, unknown>[]): string[] {
  return blocks.map((b) => b["@type"] as string);
}

test.describe("9. Structured data", () => {
  test("/en/ has Organization + WebSite, no fabricated fields", async ({
    page,
  }) => {
    await page.goto("/en/");
    const blocks = await jsonLdBlocks(page);
    const t = types(blocks);
    expect(t).toContain("Organization");
    expect(t).toContain("WebSite");
    for (const b of blocks) {
      expect(b).not.toHaveProperty("offers");
      expect(b).not.toHaveProperty("aggregateRating");
      expect(b).not.toHaveProperty("review");
    }
  });

  test("/en/valencia-group-bike-tour/ TouristTrip + BreadcrumbList integrity", async ({
    page,
  }) => {
    await page.goto("/en/valencia-group-bike-tour/");
    const blocks = await jsonLdBlocks(page);
    const t = types(blocks);
    expect(t).toContain("TouristTrip");
    expect(t).toContain("BreadcrumbList");

    const trip = blocks.find((b) => b["@type"] === "TouristTrip")!;
    const itinerary = trip.itinerary as { itemListElement: unknown[] };
    expect(itinerary.itemListElement).toHaveLength(14);
    expect(trip).not.toHaveProperty("offers");
    expect(trip).not.toHaveProperty("aggregateRating");
    expect(trip).not.toHaveProperty("review");

    // TouristTrip name equals the visible h1 text
    const h1 = (await page.locator("h1").textContent())?.trim();
    expect((trip.name as string).trim()).toBe(h1);

    // provider @id matches the Organization @id (homepage carries Organization)
    await page.goto("/en/");
    const homeBlocks = await jsonLdBlocks(page);
    const org = homeBlocks.find((b) => b["@type"] === "Organization")!;
    expect((trip.provider as { "@id": string })["@id"]).toBe(org["@id"]);
  });

  test("/es/ tour page JSON-LD also has 14 itinerary items, no offers", async ({
    page,
  }) => {
    await page.goto("/es/tour-bicicleta-valencia-grupos/");
    const blocks = await jsonLdBlocks(page);
    const trip = blocks.find((b) => b["@type"] === "TouristTrip")!;
    const itinerary = trip.itinerary as { itemListElement: unknown[] };
    expect(itinerary.itemListElement).toHaveLength(14);
    expect(trip).not.toHaveProperty("offers");
    const h1 = (await page.locator("h1").textContent())?.trim();
    expect((trip.name as string).trim()).toBe(h1);
  });
});
