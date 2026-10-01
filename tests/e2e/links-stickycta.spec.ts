import { test, expect } from "@playwright/test";

const SEEDS = ["/en/", "/es/", "/en/valencia-group-bike-tour/", "/es/tour-bicicleta-valencia-grupos/"];

test.describe("13. Broken links and images", () => {
  test("all internal links from seed pages return 200 and all images load", async ({
    page,
    request,
  }) => {
    const urls = new Set<string>();
    for (const seed of SEEDS) {
      await page.goto(seed, { waitUntil: "domcontentloaded" });
      const hrefs = await page.$$eval("a[href]", (as) =>
        as.map((a) => (a as HTMLAnchorElement).href),
      );
      for (const h of hrefs) {
        const u = new URL(h);
        if (u.origin === "http://localhost:3100" && !u.pathname.startsWith("/api")) {
          urls.add(u.pathname);
        }
      }
      // images on the seed page itself must load
      const broken = await page.$$eval("img", (imgs) =>
        imgs
          .filter((i) => i.complete && i.naturalWidth === 0)
          .map((i) => i.getAttribute("src")),
      );
      expect(broken, `broken images on ${seed}`).toEqual([]);
    }
    for (const path of urls) {
      const res = await request.get(path);
      expect(res.status(), `${path} should return 200`).toBe(200);
    }
  });
});

test.describe("14. Sticky mobile booking CTA", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("visible on /en/, hidden on booking pages, hides near footer", async ({ page }) => {
    const cta = page.locator("div.fixed.bottom-0 a");

    await page.goto("/en/", { waitUntil: "networkidle" });
    await expect(cta).toBeVisible();

    // hidden when footer enters the viewport
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(cta).toHaveCount(0);

    await page.goto("/en/book/", { waitUntil: "networkidle" });
    await expect(cta).toHaveCount(0);

    await page.goto("/es/reservar/", { waitUntil: "networkidle" });
    await expect(cta).toHaveCount(0);

    await page.goto("/es/", { waitUntil: "networkidle" });
    await expect(cta).toBeVisible();
  });
});
