import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Heading, Section } from "@/components/ui";
import { LegalSections } from "@/components/sections/LegalSections";

const sectionKeys = ["requests", "groupSize", "sharedPrices", "privateTours", "payment", "cancellation", "review"];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.bookingTerms" });
  return buildMetadata({
    locale,
    pathname: "/booking-terms",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function BookingTermsPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.bookingTerms" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCta = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: t("heading"), pathname: "/booking-terms" },
        ]}
      />

      <Section>
        <Heading as="h1">{t("heading")}</Heading>
        <LegalSections namespace="legal.bookingTerms" sectionKeys={sectionKeys} />
        <div className="mt-12">
          <ButtonLink href="/book">{tCta("book")}</ButtonLink>
        </div>
      </Section>
    </>
  );
}
