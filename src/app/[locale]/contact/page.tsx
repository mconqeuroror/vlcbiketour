import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Heading, Section } from "@/components/ui";
import { ContactForm } from "@/components/contact/ContactForm";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return buildMetadata({
    locale,
    pathname: "/contact",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "contact" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: tNav("contact"), pathname: "/contact" },
        ]}
      />

      <Section>
        <div className="max-w-prose">
          <Heading as="h1">{t("heading")}</Heading>
          <p className="mt-5 text-[17px] leading-relaxed text-pretty text-[var(--color-brand-charcoal)] md:text-[19px]">
            {t("intro")}
          </p>
          <div className="mt-8">
            <ButtonLink href="/book" variant="secondary">
              {t("bookingCta")}
            </ButtonLink>
          </div>
        </div>
        <ContactForm />
      </Section>
    </>
  );
}
