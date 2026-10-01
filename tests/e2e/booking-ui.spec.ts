import { test, expect, type Page } from "@playwright/test";
import { futureDate, pastDate, findBookingByEmail } from "./helpers";

async function fillBaseForm(
  page: Page,
  labels: { date: string; time: string; name: string; email: string },
  email: string,
) {
  await page.getByLabel(labels.date, { exact: true }).fill(futureDate(3));
  await page.getByLabel(labels.time, { exact: true }).selectOption("10:00");
  await page.getByLabel(labels.name, { exact: true }).fill("QA Reviewer");
  await page.getByLabel(labels.email, { exact: true }).fill(email);
}

const ES = {
  url: "/es/reservar/",
  labels: {
    date: "Fecha preferida",
    time: "Hora de salida preferida",
    groupSize: "Tamaño del grupo",
    name: "Nombre de la persona de contacto",
    email: "Email",
  },
  review: "Revisa tu solicitud",
  errMin: "El tamaño mínimo del grupo es de 5 personas.",
  errMax: "El tamaño máximo del grupo es de 20 personas.",
  errPast: "La fecha no puede estar en el pasado.",
};
const EN = {
  url: "/en/book/",
  labels: {
    date: "Preferred date",
    time: "Preferred departure time",
    groupSize: "Group size",
    name: "Lead contact name",
    email: "Email",
  },
  review: "Review your request",
  errMin: "The minimum group size is 5 people.",
  errMax: "The maximum group size is 20 people.",
  errPast: "The date cannot be in the past.",
};

for (const [name, L] of [
  ["es", ES],
  ["en", EN],
] as const) {
  test.describe(`6. Booking UI validation (${name})`, () => {
    test(`group size 4 rejected with localized error (${name})`, async ({
      page,
    }) => {
      await page.goto(L.url);
      await fillBaseForm(page, L.labels, `qa-${crypto.randomUUID()}@example.com`);
      await page.getByLabel(L.labels.groupSize).fill("4");
      await page.getByRole("button", { name: L.review }).click();
      await expect(page.getByText(L.errMin).first()).toBeVisible();
    });

    test(`group size 21 rejected with localized error (${name})`, async ({
      page,
    }) => {
      await page.goto(L.url);
      await fillBaseForm(page, L.labels, `qa-${crypto.randomUUID()}@example.com`);
      await page.getByLabel(L.labels.groupSize).fill("21");
      await page.getByRole("button", { name: L.review }).click();
      await expect(page.getByText(L.errMax).first()).toBeVisible();
    });

    for (const size of ["5", "20"]) {
      test(`group size ${size} passes validation → review step (${name})`, async ({
        page,
      }) => {
        await page.goto(L.url);
        await fillBaseForm(page, L.labels, `qa-${crypto.randomUUID()}@example.com`);
        await page.getByLabel(L.labels.groupSize).fill(size);
        await page.getByRole("button", { name: L.review }).click();
        // review step heading appears
        await expect(
          page.getByRole("heading", { name: L.review }),
        ).toBeVisible();
      });
    }

    test(`past date rejected (${name})`, async ({ page }) => {
      await page.goto(L.url);
      await page.getByLabel(L.labels.date, { exact: true }).fill(pastDate());
      await page
        .getByLabel(L.labels.time, { exact: true })
        .selectOption("10:00");
      await page.getByLabel(L.labels.groupSize).fill("8");
      await page.getByLabel(L.labels.name, { exact: true }).fill("QA Reviewer");
      await page
        .getByLabel(L.labels.email, { exact: true })
        .fill(`qa-${crypto.randomUUID()}@example.com`);
      // Past-date rejection is server-side: client schema only checks format,
      // so the request goes to review, then the 400 maps back to a visible error.
      await page.getByRole("button", { name: L.review }).click();
      await expect(page.getByRole("heading", { name: L.review })).toBeVisible();
      await page
        .getByRole("button", { name: name === "es" ? "Enviar solicitud de reserva" : "Send booking request" })
        .click();
      await expect(page.getByText(L.errPast).first()).toBeVisible({
        timeout: 15_000,
      });
    });
  });
}

test.describe("8. Full UI booking flow (EN)", () => {
  test("fill → review (non-commitment wording) → submit → success → row in SQLite", async ({
    page,
  }) => {
    const email = `qa-e2e-${crypto.randomUUID()}@example.com`;
    await page.goto("/en/book/");
    await fillBaseForm(page, EN.labels, email);
    await page.getByLabel("Group size").fill("7");
    await page.getByRole("button", { name: EN.review }).click();

    // review step shows summary
    await expect(page.getByRole("heading", { name: EN.review })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByText("7", { exact: true })).toBeVisible();
    // explicit non-commitment wording
    await expect(
      page.getByText(/does not confirm a reservation/i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Send booking request" })
      .click();
    // localized success panel
    await expect(
      page.getByRole("heading", { name: "Request received" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("status")).toContainText(email);

    // persisted in SQLite
    const row = await findBookingByEmail(email);
    expect(row, "booking row persisted").not.toBeNull();
    expect(row?.groupSize).toBe(7);
    expect(row?.locale).toBe("en");
    expect(row?.tourId).toBe("valencia-group-tour");
  });
});
