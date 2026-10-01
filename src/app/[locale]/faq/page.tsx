import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Heading, Section } from "@/components/ui";
import { FaqList } from "@/components/sections/FaqList";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "faq" });
  return buildMetadata({
    locale,
    pathname: "/faq",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "faq" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tHome = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: tNav("faq"), pathname: "/faq" },
        ]}
      />

      <Section>
        <Heading as="h1">{t("heading")}</Heading>
        <div className="mt-10">
          <FaqList indices={[0, 1, 2, 3, 4, 5, 6, 7]} />
        </div>
        <div className="mt-12">
          <ButtonLink href="/book">{tHome("book")}</ButtonLink>
        </div>
      </Section>
    </>
  );
}
