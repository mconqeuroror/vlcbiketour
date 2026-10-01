import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { defaultTour, getTour } from "@/config/tours";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container, Eyebrow, Heading, Prose } from "@/components/ui";
import { paymentConfigured } from "@/lib/booking/stripe";
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
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tour?: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "booking" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const query = await searchParams;
  const initialTour = getTour(query.tour ?? "") ?? defaultTour;

  return (
    <section className="py-10 sm:py-16">
      <Container>
        <div className="w-full">
          <Eyebrow>{tNav("book")}</Eyebrow>
          <Heading as="h1">{t("heading")}</Heading>
          <div className="mt-5">
            <Prose>
              <p>{t("intro")}</p>
            </Prose>
          </div>
          <div className="mt-10">
            <BookingForm key={initialTour.id} initialTourId={initialTour.id} paymentReady={paymentConfigured()} />
          </div>
        </div>
      </Container>
    </section>
  );
}
