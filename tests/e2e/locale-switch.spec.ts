import { test, expect } from "@playwright/test";
import { GUIDE_SLUGS } from "./helpers";

test.describe("5. Locale switcher preserves page context", () => {
  test("tour page: /es/tour-bicicleta-valencia-grupos/ → English link → /en/valencia-group-bike-tour/", async ({
    page,
  }) => {
    await page.goto("/es/tour-bicicleta-valencia-grupos/");
    await page
      .getByRole("navigation", { name: /language|idioma/i })
      .getByRole("link", { name: "English" })
      .click();
    await expect(page).toHaveURL(/\/en\/valencia-group-bike-tour\/?$/);
    await expect(page.locator("h1")).toContainText("Valencia Group Bike Tour");
  });

  test("guide article keeps context across locales", async ({ page }) => {
    const esUrl = `/es/guias/${GUIDE_SLUGS["getting-around-valencia-by-bike"].es}/`;
    await page.goto(esUrl);
    await page
      .getByRole("navigation", { name: /language|idioma/i })
      .getByRole("link", { name: "English" })
      .click();
    await expect(page).toHaveURL(
      new RegExp(
        `/en/guides/${GUIDE_SLUGS["getting-around-valencia-by-bike"].en}/?$`,
      ),
    );
  });
});
