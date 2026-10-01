import { useLocale, useTranslations } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { guideSlug, guides } from "@/lib/guides";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Heading, Section } from "@/components/ui";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "guides" });
  return buildMetadata({
    locale,
    pathname: "/guides",
    title: t("title"),
    description: t("metaDescription"),
  });
}

function GuideCard({ id }: { id: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("guides");

  return (
    <li className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
      <h2 className="text-[23px] font-semibold leading-[1.2] tracking-[-0.025em] text-balance">
        <Link
          href={{
            pathname: "/guides/[guideSlug]",
            params: { guideSlug: guideSlug(id, locale) },
          }}
          className="text-[var(--color-brand-ink)] no-underline hover:text-[var(--color-link)] hover:underline underline-offset-4"
        >
          {t(`${id}.heading`)}
        </Link>
      </h2>
      <p className="mt-3 text-[17px] leading-relaxed text-[var(--color-text-muted)]">
        {t(`${id}.metaDescription`)}
      </p>
      <p className="mt-5">
        <Link
          href={{
            pathname: "/guides/[guideSlug]",
            params: { guideSlug: guideSlug(id, locale) },
          }}
          className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--color-link)] no-underline hover:underline"
        >
          {t("readGuide")}
        </Link>
      </p>
    </li>
  );
}

export default async function GuidesPage({
  params,
}: {
  params: Promise<{ locale: "en" | "es" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "guides" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: tNav("guides"), pathname: "/guides" },
        ]}
      />

      <Section>
        <div className="max-w-prose">
          <Heading as="h1">{t("heading")}</Heading>
          <p className="mt-5 text-[17px] leading-relaxed text-pretty text-[var(--color-brand-charcoal)] md:text-[19px]">
            {t("intro")}
          </p>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {guides.map((guide) => (
            <GuideCard key={guide.id} id={guide.id} />
          ))}
        </ul>
      </Section>
    </>
  );
}
