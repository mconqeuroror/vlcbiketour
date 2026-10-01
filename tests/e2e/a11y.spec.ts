import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

test.describe("10a. axe-core scans", () => {
  for (const path of [
    "/en/",
    "/es/",
    "/en/valencia-group-bike-tour/",
    "/en/book/",
    "/es/reservar/",
  ]) {
    test(`no serious/critical violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const bad = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} nodes`),
        `violations on ${path}`,
      ).toEqual([]);
      // record minor/moderate counts for the report via stdout
      const minor = results.violations.filter(
        (v) => v.impact === "minor" || v.impact === "moderate",
      );
      if (minor.length > 0) {
        console.log(
          `[axe] ${path} non-serious:`,
          minor.map((v) => `${v.id}(${v.impact})`).join(", "),
        );
      }
    });
  }
});

test("keyboard selects tour, date and time, then reaches guest details", async ({ page }) => {
  await page.goto("/en/book/");
  await page.locator('[data-tour="shared-nl"]').focus(); await page.keyboard.press("Enter");
  await page.locator('[data-date]:not(:disabled)').last().focus(); await page.keyboard.press("Space");
  await page.locator('[data-time="10:00"]').focus(); await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Continue", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Enter your details" })).toBeFocused();
  const ids = new Set<string>();
  for (let i = 0; i < 15; i++) { await page.keyboard.press("Tab"); ids.add(await page.evaluate(() => document.activeElement?.id || "")); }
  for (const id of ["name", "email", "phone", "message"]) expect(ids).toContain(id);
  await page.locator("#name").focus();
  const outline = await page.locator("#name").evaluate(el => getComputedStyle(el).outlineWidth);
  expect(parseFloat(outline)).toBeGreaterThan(0);
});

test.describe("10c. Reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("no animations/transitions running under prefers-reduced-motion", async ({
    page,
  }) => {
    await page.goto("/en/");
    const result = await page.evaluate(() => {
      const scrollBehavior = getComputedStyle(document.documentElement).scrollBehavior;
      const animated = document
        .getAnimations()
        .filter((a) => a.playState === "running")
        .map((a) => ((a.effect as KeyframeEffect | null)?.target as Element | null)?.tagName ?? "unknown");
      const offenders: string[] = [];
      for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 400)) {
        const cs = getComputedStyle(el);
        if (
          (parseFloat(cs.transitionDuration) > 0 || parseFloat(cs.animationDuration) > 0) &&
          cs.transitionProperty !== "none"
        ) {
          offenders.push(
            `${el.tagName}.${el.className.toString().slice(0, 40)} t=${cs.transitionDuration} a=${cs.animationDuration}`,
          );
        }
        if (offenders.length >= 10) break;
      }
      return { scrollBehavior, animated, offenders };
    });
    console.log("[reduced-motion]", JSON.stringify(result));
    expect(result.scrollBehavior).toBe("auto");
    expect(result.animated, "running CSS animations").toEqual([]);
    expect(result.offenders, "elements with non-zero durations").toEqual([]);
  });
});
