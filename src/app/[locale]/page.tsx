import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import { Hero } from "@/components/home/Hero";
import { ProofStrip } from "@/components/home/ProofStrip";
import { IntroSection } from "@/components/home/IntroSection";
import { TourCards } from "@/components/home/TourCards";
import { EditorialPair } from "@/components/home/EditorialPair";
import { CoastalBand } from "@/components/home/CoastalBand";
import { GroupBand } from "@/components/home/GroupBand";
import { FaqTeaser } from "@/components/sections/FaqTeaser";
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
  const t = await getTranslations({ locale, namespace: "home" });
  return buildMetadata({
    locale,
    pathname: "/",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Hero />
      <ProofStrip />
      <IntroSection />
      <TourCards />
      <EditorialPair />
      <CoastalBand />
      <GroupBand />
      <FaqTeaser />
      <FinalCta />
    </>
  );
}
