import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Heading, Section } from "@/components/ui";
import { LegalSections } from "@/components/sections/LegalSections";

const sectionKeys = ["data", "use", "retention", "rights", "review"];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  return buildMetadata({
    locale,
    pathname: "/privacy",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.privacy" });

  return (
    <Section>
      <Heading as="h1">{t("heading")}</Heading>
      <LegalSections namespace="legal.privacy" sectionKeys={sectionKeys} />
    </Section>
  );
}
