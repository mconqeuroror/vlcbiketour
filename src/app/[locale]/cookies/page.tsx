import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { Heading, Section } from "@/components/ui";
import { LegalSections } from "@/components/sections/LegalSections";

const sectionKeys = ["necessary", "analytics", "manage"];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal.cookies" });
  return buildMetadata({
    locale,
    pathname: "/cookies",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal.cookies" });

  return (
    <Section>
      <Heading as="h1">{t("heading")}</Heading>
      <LegalSections namespace="legal.cookies" sectionKeys={sectionKeys} />
    </Section>
  );
}
