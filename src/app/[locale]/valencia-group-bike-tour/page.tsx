import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd, TouristTripJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Container, Heading } from "@/components/ui";
import { GlanceFacts } from "@/components/sections/GlanceFacts";
import { TourStops } from "@/components/sections/TourStops";
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
  const tImages = await getTranslations({ locale, namespace: "images" });

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

      <section className="border-b border-[var(--color-border)] bg-white">
        <Container className="py-14 sm:py-20">
          <div className="max-w-prose">
            <Heading as="h1">{t("name")}</Heading>
            <p className="mt-5 text-[17px] leading-relaxed text-pretty text-[var(--color-brand-charcoal)] md:text-[19px]">
              {t("intro")}
            </p>
            <div className="mt-8">
              <ButtonLink href="/book">{t("cta")}</ButtonLink>
            </div>
          </div>
          <div className="relative mt-12 aspect-[3/2] overflow-hidden rounded-[var(--radius-image)] border border-[var(--color-border)] sm:aspect-[2/1]">
            <Image
              src="/images/turia.jpg"
              alt={tImages("turiaAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      <GlanceFacts />
      <TourStops />
      <IncludedSection />
      <BookingConditions />
      <HowItWorks />
      <FinalCta cta={t("cta")} />
    </>
  );
}
