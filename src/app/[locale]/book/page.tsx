import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { operator } from "@/config/operator";
import { defaultTour } from "@/config/tours";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container, Eyebrow, Heading, Prose } from "@/components/ui";
import { BookingForm } from "@/components/booking/BookingForm";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "booking" });
  return buildMetadata({
    locale,
    pathname: "/book",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "booking" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tTour = await getTranslations({
    locale,
    namespace: "tours.valencia-group-tour",
  });

  // Instant-mode branch: when operator.bookingMode === "instant" this page
  // should render a checkout UI on top of lib/booking/stripe.ts
  // (createCheckoutSession) instead of the request form below. Activation
  // steps are listed in the module header of src/lib/booking/stripe.ts.

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="max-w-[720px]">
          <Eyebrow>{tNav("book")}</Eyebrow>
          <Heading as="h1">{t("heading")}</Heading>
          <div className="mt-5">
            <Prose>
              <p>{t("intro")}</p>
            </Prose>
          </div>
          <div className="mt-10">
            <BookingForm
              tourId={defaultTour.id}
              tourName={tTour("name")}
              departureTimes={defaultTour.departureTimes}
              guideLanguages={operator.guideLanguages}
              groupSizeMin={operator.groupSize.min}
              groupSizeMax={operator.groupSize.max}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
