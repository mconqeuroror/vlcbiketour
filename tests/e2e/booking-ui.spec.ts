import { test, expect } from "@playwright/test";
for (const path of ["/en/book/", "/es/reservar/"]) {
  test(`calendar restricts group sizes and does not expose details before a slot: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("#name")).toHaveCount(0);
    await expect(page.locator("#groupSize option")).toHaveCount(20);
    await expect(page.locator("#groupSize option").first()).toHaveAttribute("value", "1");
    await expect(page.locator("#groupSize option").last()).toHaveAttribute("value", "20");
    await page.locator('[data-tour="private-city"]').click();
    await expect(page.locator("#groupSize option")).toHaveCount(10);
    await expect(page.locator("#guideLanguage option")).toHaveCount(6);
    await expect(page.locator('[class*=continue] button')).toBeDisabled();
    await page.locator('[data-date]:not(:disabled)').last().click();
    await expect(page.locator('[class*=continue] button')).toBeDisabled();
    await page.locator('[data-time="14:00"]').click();await page.locator('[class*=continue] button').click();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.getByTestId("reservation-total")).toContainText("225");
  });
}
