import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd, TouristTripJsonLd } from "@/components/seo/JsonLd";
import { Container, Heading } from "@/components/ui";
import { TourExplorer } from "@/components/tours/TourExplorer";
import { IncludedSection } from "@/components/sections/IncludedSection";
import { BookingConditions } from "@/components/sections/BookingConditions";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { FinalCta } from "@/components/sections/FinalCta";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "tours.valencia-group-tour" });
  return buildMetadata({
    locale,
    pathname: "/valencia-group-bike-tour",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function TourPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "tours.valencia-group-tour" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <TouristTripJsonLd locale={locale} />
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: t("name"), pathname: "/valencia-group-bike-tour" },
        ]}
      />

      <section className="bg-white">
        <Container className="pb-4 pt-12 sm:pt-16">
          <div className="max-w-prose">
            <Heading as="h1">{t("name")}</Heading>
            <p className="mt-5 text-[17px] leading-relaxed text-pretty text-[var(--color-brand-charcoal)] md:text-[19px]">
              {t("intro")}
            </p>
          </div>
        </Container>
      </section>

      <TourExplorer />
      <IncludedSection />
      <BookingConditions />
      <HowItWorks />
      <FinalCta cta={t("cta")} />
    </>
  );
}
