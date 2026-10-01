import Image from "next/image";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { ShieldCheck, MapPin, HeartHandshake } from "lucide-react";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Container, Heading, Section } from "@/components/ui";
import { FinalCta } from "@/components/sections/FinalCta";

const valueIcons = {
  safety: ShieldCheck,
  honest: HeartHandshake,
  local: MapPin,
} as const;

const valueKeys = ["safety", "honest", "local"] as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildMetadata({
    locale,
    pathname: "/about",
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tImages = await getTranslations({ locale, namespace: "images" });

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: tNav("about"), pathname: "/about" },
        ]}
      />

      <Section>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <Heading as="h1">{t("heading")}</Heading>
            <div className="mt-6 max-w-prose space-y-4 text-[17px] leading-relaxed text-[var(--color-brand-charcoal)]">
              <p className="text-pretty">{t("body1")}</p>
              <p className="text-pretty">{t("body2")}</p>
            </div>
            <div className="mt-8">
              <ButtonLink href="/book">{t("cta")}</ButtonLink>
            </div>
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-image)] border border-[var(--color-border)]">
            <Image
              src="/images/about.jpg"
              alt={tImages("aboutAlt")}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      </Section>

      <Section className="border-t border-[var(--color-border)]">
        <Heading as="h2">{t("valuesTitle")}</Heading>
        <ul className="mt-10 grid gap-10 sm:grid-cols-3">
          {valueKeys.map((key) => {
            const IconComponent = valueIcons[key];
            return (
              <li key={key} className="border-t border-[var(--color-border)] pt-5">
                <IconComponent
                  className="h-6 w-6 text-[var(--color-brand-ink)]"
                  aria-hidden="true"
                />
                <h3 className="mt-3 text-[23px] font-semibold leading-[1.2] tracking-[-0.025em] text-balance text-[var(--color-brand-ink)]">
                  {t(`values.${key}.title`)}
                </h3>
                <p className="mt-3 text-[17px] leading-relaxed text-[var(--color-text-muted)]">
                  {t(`values.${key}.text`)}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      <FinalCta cta={t("cta")} />
    </>
  );
}
