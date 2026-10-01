import { test, expect } from "@playwright/test";
import { LOCALIZED_PAGES } from "./helpers";

test.describe("1. Pages render 200 with correct <html lang>", () => {
  for (const pair of LOCALIZED_PAGES) {
    for (const locale of ["en", "es"] as const) {
      test(`${pair[locale]} → 200, lang=${locale}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
        page.on("console", (msg) => {
          if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
        });
        const res = await page.goto(pair[locale]);
        expect(res?.status(), pair[locale]).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        // 12. no console / hydration errors on sampled pages
        expect(errors, `console errors on ${pair[locale]}`).toEqual([]);
      });
    }
  }
});

test.describe("2. Root / redirects deterministically to /en/", () => {
  test("default headers", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/?$/);
  });

  test("with Spanish Accept-Language header", async ({ browser }) => {
    const ctx = await browser.newContext({
      extraHTTPHeaders: { "Accept-Language": "es-ES,es;q=0.9,en;q=0.1" },
    });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/?$/);
    await ctx.close();
  });
});

test.describe("11. No-JS smoke", () => {
  test.use({ javaScriptEnabled: false });

  test("/en/ has headline, tour facts, nav links and booking CTA in initial HTML", async ({
    page,
  }) => {
    await page.goto("/en/");
    await expect(page.locator("h1")).toContainText("Guided bike tours in Valencia");
    await expect(page.getByRole("link", { name: /tour/i }).first()).toBeVisible();
    // booking CTA link present in SSR HTML
    const html = await page.content();
    expect(html).toContain("/en/book");
    // nav links
    expect(html).toContain("/en/about");
    expect(html).toContain("/en/faq");
  });

  test("/es/tour-bicicleta-valencia-grupos/ has headline, facts and booking CTA", async ({
    page,
  }) => {
    await page.goto("/es/tour-bicicleta-valencia-grupos/");
    await expect(page.locator("h1")).toContainText(
      "Tour en bicicleta por Valencia para grupos",
    );
    const html = await page.content();
    expect(html).toContain("/es/reservar");
    // tour facts rendered server-side
    expect(html.toLowerCase()).toContain("valencia");
  });
});
