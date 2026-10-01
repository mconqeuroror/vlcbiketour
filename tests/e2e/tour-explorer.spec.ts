import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = {
  en: "/en/valencia-group-bike-tour/",
  es: "/es/tour-bicicleta-valencia-grupos/",
  fr: "/fr/tour-velo-valence-groupes/",
  ar: "/ar/valencia-group-bike-tour/",
};

for (const [locale, route] of Object.entries(routes)) {
  for (const width of [1440, 390]) {
    test(`${locale} ${width}: selection, map, photos and correct booking product`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 950 } });
      const page = await context.newPage();
      const errors: string[] = [];
      const externalRequests: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("request", (request) => { if (!request.url().startsWith("http://localhost:") && request.url().startsWith("http")) externalRequests.push(request.url()); });
      await page.route("**/api/**", (request) => request.abort());
      await page.goto(route);
      await expect(page.getByTestId("selected-tour")).toHaveCount(0);
      await expect(page.locator("#tour-selection [role=group] > button")).toHaveCount(3);
      await page.locator("button#shared").click();
      await expect(page.getByTestId("city-route")).toBeVisible();
      await expect(page.locator(".route-number")).toHaveCount(14);
      await expect(page.getByTestId("city-route").locator("ol > li")).toHaveCount(14);
      await expect(page.locator("button#shared")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("selected-tour").locator("table")).toHaveCount(0);

      const overlaps = await page.locator(".route-number").evaluateAll((markers) => {
        const boxes = markers.map((marker) => marker.getBoundingClientRect());
        return boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => Math.hypot(a.left + a.width / 2 - b.left - b.width / 2, a.top + a.height / 2 - b.top - b.height / 2) < (a.width + b.width) / 2)).length;
      });
      expect(overlaps).toBe(0);
      const marker = page.locator(".route-number").nth(5);
      await marker.click();
      await expect(page.getByTestId("active-stop").locator("img")).toHaveAttribute("src", /06-exposicion/);
      await expect(marker).toHaveAttribute("aria-pressed", "true");
      const photos = page.getByTestId("city-route").locator("ol button");
      await photos.nth(9).click();
      await expect(page.getByTestId("active-stop").locator("img")).toHaveAttribute("src", /arts-and-sciences/);
      await photos.last().click();
      await expect(page.getByTestId("active-stop").locator("h4")).toContainText("Casa Fenicia");
      await expect(page.getByTestId("active-stop").locator("img")).toHaveAttribute("alt", /Corretgeria/);
      for (const image of await page.getByTestId("city-route").locator("ol img").all()) {
        await image.scrollIntoViewIfNeeded();
        await expect.poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBe(0);
      if (width === 390 || locale === "en") {
        const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
        expect(accessibility.violations).toEqual([]);
      }
      await page.locator("button#private-architecture").click();
      await expect(page.getByTestId("city-route")).toHaveCount(0);
      await expect(page.locator("#architecture-route-title")).toBeVisible();
      await expect(page.getByTestId("selected-tour").locator('a[href*="tour=private-architecture"]').first()).toBeVisible();
      if (width === 390) await expect(page.locator("div.fixed.bottom-0 a")).toHaveAttribute("href", /tour=private-architecture/);
      await page.locator("button#private-city").click();
      await expect(page.getByTestId("city-route")).toBeVisible();
      await expect(page.locator(".route-number")).toHaveCount(14);
      const bookingLink = page.getByTestId("selected-tour").locator('a[href*="tour=private-city"]').first();
      await bookingLink.click();
      await expect(page.locator('[data-tour="private-city"]')).toHaveAttribute("aria-pressed", "true");
      expect(errors).toEqual([]);
      expect(externalRequests).toEqual([]);
      await context.close();
    });
  }
}

test("direct links, history, keyboard selection and change-tour link", async ({ page }) => {
  await page.goto(routes.en + "#private-architecture");
  await expect(page.locator("#architecture-route-title")).toBeVisible();
  await page.locator("button#private-city").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("city-route")).toBeVisible();
  await expect(page.getByTestId("selected-tour")).toBeFocused();
  await page.goBack();
  await expect(page.locator("#architecture-route-title")).toBeVisible();
  await expect(page.getByTestId("city-route")).toHaveCount(0);
  await page.goForward();
  await expect(page.getByTestId("city-route")).toBeVisible();
  await expect(page.locator(".route-number")).toHaveCount(14);
  await page.locator(".route-number").nth(3).focus();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("active-stop").locator("img")).toHaveAttribute("src", /04-serranos/);
  await page.locator("#route-map-frame button").nth(2).click();
  const visibleMarkers = await page.locator(".route-number").evaluateAll((markers) => {
    const map = document.querySelector("#route-map-frame")!.getBoundingClientRect();
    return markers.filter((marker) => { const b = marker.getBoundingClientRect(); return b.left >= map.left && b.right <= map.right && b.top >= map.top && b.bottom <= map.bottom; }).length;
  });
  expect(visibleMarkers).toBe(14);
  await page.getByRole("link", { name: "Change tour", exact: true }).click();
  await expect(page.getByTestId("selected-tour")).toHaveCount(0);
  await expect(page.locator("button#private-city")).toHaveAttribute("aria-pressed", "false");
});

test("map-data failure retains photo itinerary and booking", async ({ page }) => {
  await page.route("**/maps/valencia-city.geojson", (route) => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto(routes.en + "#shared");
  await expect(page.getByText("The map could not load.", { exact: false })).toBeVisible();
  await expect(page.getByTestId("city-route").locator("ol > li")).toHaveCount(14);
  await page.getByTestId("city-route").locator("ol button").nth(3).click();
  await expect(page.getByTestId("active-stop").locator("h4")).toHaveText("Serranos Towers");
  await expect(page.getByTestId("selected-tour").locator('a[href*="tour=valencia-group-tour"]').first()).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`selected tour persists through languages and booking links at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.route("**/api/**", (route) => route.abort());
    await page.goto(routes.en + "#private-architecture");
    await expect(page.locator("#architecture-route-title")).toBeVisible();
    await expect(page.locator("main > section").last().locator('a[href*="tour=private-architecture"]')).toHaveCount(1);
    if (width < 1024) await page.locator('button[aria-controls="mobile-nav"]').click();
    const nav = width < 1024 ? page.locator("#mobile-nav") : page.locator("header");
    await expect(nav.locator('a[href*="tour=private-architecture"]')).toHaveCount(1);
    await nav.locator('button[aria-haspopup="listbox"]').filter({ visible: true }).click();
    await page.getByRole("listbox").locator('a[hreflang="es"]').click();
    await expect(page).toHaveURL(/\/es\/tour-bicicleta-valencia-grupos\/#private-architecture$/);
    await expect(page.locator("#architecture-route-title")).toBeVisible();
    await expect(page.locator("button#private-architecture")).toHaveAttribute("aria-pressed", "true");
    if (width < 1024 && !await page.locator("#mobile-nav").isVisible()) await page.locator('button[aria-controls="mobile-nav"]').click();
    await nav.locator('button[aria-haspopup="listbox"]').filter({ visible: true }).click();
    await page.getByRole("listbox").locator('a[hreflang="ar"]').click();
    await expect(page).toHaveURL(/\/ar\/valencia-group-bike-tour\/#private-architecture$/);
    await expect(page.locator("#architecture-route-title")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.goto("/en/");
    if (width < 1024) await page.locator('button[aria-controls="mobile-nav"]').click();
    await expect(nav.locator('a[href*="tour="]')).toHaveCount(0);
    await expect(nav.locator('a[href="/en/book/"]')).toHaveCount(1);
  });
}
