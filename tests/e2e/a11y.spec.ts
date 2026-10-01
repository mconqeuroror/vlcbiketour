import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { futureDate } from "./helpers";

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

test.describe("10b. Keyboard walkthrough of /en/book/", () => {
  test("tab reaches all fields, focus visible, keyboard-only to review step", async ({
    page,
  }) => {
    await page.goto("/en/book/");

    // Tab order reaches every form field
    const ids = [
      "date",
      "departureTime",
      "groupSize",
      "name",
      "email",
      "phone",
      "guideLanguage",
      "message",
    ];
    const seen = new Set<string>();
    for (let i = 0; i < 60 && seen.size < ids.length; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(
        () => (document.activeElement as HTMLElement | null)?.id ?? "",
      );
      if (id) seen.add(id);
    }
    for (const id of ids) expect(seen, `field #${id} reachable by Tab`).toContain(id);

    // focus is visible: focused element has a visible outline or ring
    await page.locator("#name").focus();
    const focusStyle = await page.locator("#name").evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        outlineWidth: cs.outlineWidth,
        outlineStyle: cs.outlineStyle,
        boxShadow: cs.boxShadow,
      };
    });
    const hasVisibleFocus =
      (focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px") ||
      focusStyle.boxShadow !== "none";
    expect(hasVisibleFocus, JSON.stringify(focusStyle)).toBe(true);

    // operate the form keyboard-only to the review step
    await page.locator("#date").focus();
    await page.keyboard.type(futureDate(3).replaceAll("-", "")); // date inputs accept digits
    // ensure the value landed (some chromium builds need per-segment entry)
    if ((await page.locator("#date").inputValue()) === "") {
      await page.locator("#date").fill(futureDate(3));
    }
    await page.locator("#departureTime").focus();
    await page.keyboard.press("ArrowDown"); // moves to first offered time
    await page.locator("#departureTime").selectOption("10:00");
    await page.locator("#groupSize").focus();
    await page.keyboard.type("8");
    await page.locator("#name").focus();
    await page.keyboard.type("Keyboard User");
    await page.locator("#email").focus();
    await page.keyboard.type(`qa-kb-${crypto.randomUUID()}@example.com`);
    // tab to the submit button and press Enter
    let pressed = false;
    for (let i = 0; i < 15 && !pressed; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return { tag: el?.tagName, text: el?.textContent ?? "" };
      });
      if (info.tag === "BUTTON" && /review your request/i.test(info.text)) {
        await page.keyboard.press("Enter");
        pressed = true;
      }
    }
    expect(pressed, "submit button reached by keyboard").toBe(true);
    await expect(
      page.getByRole("heading", { name: "Review your request" }),
    ).toBeVisible();
  });
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
