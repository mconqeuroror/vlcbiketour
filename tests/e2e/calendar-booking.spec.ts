import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const locales = { en: "/en/book/", es: "/es/reservar/", fr: "/fr/reserver/", ar: "/ar/book/" };
for (const [locale, path] of Object.entries(locales)) for (const width of [1440, 390]) {
  test(`${locale} ${width}: calendar, language pricing, details and Stripe redirect`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
    let payload: Record<string, unknown> = {};
    await page.route("**/api/bookings", async route => { payload = route.request().postDataJSON(); await route.fulfill({ json: { ok: true, url: "https://checkout.stripe.com/c/pay/local-test" } }); });
    await page.route("https://checkout.stripe.com/**", route => route.fulfill({ contentType: "text/html", body: "<h1>Intercepted Stripe checkout</h1>" }));
    await page.goto(path);
    await expect(page.locator("#name")).toHaveCount(0);
    await page.locator('[data-tour="shared-nl"]').click(); await page.locator("#groupSize").selectOption("2");
    await expect(page.getByTestId("reservation-total")).toContainText(new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(60));
    await page.locator('[data-date]:not(:disabled)').last().click();
    await expect(page.locator('[data-time]')).toHaveCount(1);
    await expect(page.locator('[data-time="10:00"]')).toContainText("13:00");
    await page.locator('[data-time="10:00"]').click();
    await page.locator('[data-tour="shared-en"]').click();
    await expect(page.locator('[data-time]')).toHaveCount(0);
    await expect(page.getByTestId("reservation-total")).toContainText(new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(50));
    await page.locator('[data-date]:not(:disabled)').last().click(); await expect(page.locator('[data-time="10:30"]')).toContainText("13:30");
    await page.locator('[data-time="10:30"]').click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    const a11y = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(a11y.violations).toEqual([]);
    await page.locator('[class*=continue] button').click();
    await page.getByTestId("pay-reservation").click(); await expect(page.getByTestId("booking-calendar").getByRole("alert")).toBeVisible();
    await page.locator("#name").fill("Calendar Test"); await page.locator("#email").fill("calendar@example.invalid");
    await page.getByRole("checkbox").check();
    await page.getByTestId("pay-reservation").click();
    await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/local-test");
    expect(payload).toMatchObject({ locale, tourId: "valencia-group-tour", departureTime: "10:30", guideLanguage: "en", groupSize: 2, termsAccepted: true });
    expect(payload).not.toHaveProperty("amountCents"); expect(errors).toEqual([]);
  });
}

test("private time boundaries, guide choices, consent, cancellation recovery and payment status", async ({ page }) => {
  await page.route("**/api/bookings", route => route.fulfill({ json: { ok: true, url: "https://checkout.stripe.com/c/pay/local-test" } }));
  await page.route("https://checkout.stripe.com/**", route => route.fulfill({ body: "Intercepted checkout" }));
  await page.goto("/en/book/?tour=private-architecture");
  await expect(page.locator("#guideLanguage option")).toHaveCount(2);
  await expect(page.getByTestId("reservation-total")).toContainText("225");
  await page.locator('[data-date]:not(:disabled)').last().click();
  await expect(page.locator("[data-time]")).toHaveCount(13);
  await expect(page.locator("[data-time]").first()).toHaveAttribute("data-time", "10:00");
  await expect(page.locator("[data-time]").last()).toHaveAttribute("data-time", "16:00");
  await page.locator('[data-time="16:00"]').click();await page.locator('[class*=continue] button').click();
  await page.locator("#name").fill("Private Test");await page.locator("#email").fill("private@example.invalid");
  await page.getByRole("checkbox").check();await page.getByTestId("pay-reservation").click();await expect(page).toHaveURL(/checkout.stripe.com/);
  await page.goto("/en/book/?tour=private-architecture&payment=cancelled");
  await expect(page.locator("#name")).toHaveValue("Private Test");await expect(page.getByText("Payment was cancelled.", { exact: false })).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await page.route("**/api/bookings/payment-status?**", route => route.fulfill({ json: { status: "pending" } }));
  await page.goto("/en/book/?payment=success&session_id=cs_test_forged_but_no_payment");
  await expect(page.getByRole("heading", { name: "Checking your payment" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Payment received" })).toHaveCount(0);
  await page.route("**/api/bookings/payment-status?**", route => route.fulfill({ json: { status: "paid_pending_confirmation" } }));
  await expect(page.getByRole("heading", { name: "Payment received" })).toBeVisible();
});

test("missing Stripe configuration gives no fake success or unpaid submission", async ({ page }) => {
  test.skip(!process.env.PAYMENT_UNAVAILABLE_BASE_URL, "Separate server without Stripe credentials required for this configuration check");
  let submissions = 0; page.on("request", request => { if (request.method() === "POST" && request.url().includes("/api/bookings")) submissions++; });
  await page.goto(process.env.PAYMENT_UNAVAILABLE_BASE_URL + "/en/book/");await page.locator('[data-date]:not(:disabled)').last().click();await page.locator('[data-time="10:30"]').click();await page.locator('[class*=continue] button').click();
  await page.locator("#name").fill("Unavailable Test");await page.locator("#email").fill("unavailable@example.invalid");await page.getByRole("checkbox").check();
  await page.getByTestId("pay-reservation").click();await expect(page.getByTestId("booking-calendar").getByRole("alert")).toContainText("Online payment is temporarily unavailable");
  expect(submissions).toBe(0);await expect(page).toHaveURL(new URL("/en/book/", process.env.PAYMENT_UNAVAILABLE_BASE_URL!).href);
});

test("blocked browser storage does not prevent secure checkout", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Blocked", "SecurityError"); } }); });
  await page.route("**/api/bookings", route => route.fulfill({ json: { ok: true, url: "https://checkout.stripe.com/c/pay/local-test" } }));
  await page.route("https://checkout.stripe.com/**", route => route.fulfill({ body: "Intercepted checkout" }));
  await page.goto("/en/book/?payment=cancelled");
  await page.locator('[data-date]:not(:disabled)').last().click();await page.locator('[data-time="10:30"]').click();await page.locator('[class*=continue] button').click();
  await page.locator("#name").fill("No Storage Test");await page.locator("#email").fill("nostorage@example.invalid");await page.getByRole("checkbox").check();await page.getByTestId("pay-reservation").click();
  await expect(page).toHaveURL("https://checkout.stripe.com/c/pay/local-test");
});
