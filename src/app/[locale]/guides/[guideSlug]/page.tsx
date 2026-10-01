import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";
import { guideIdFromSlug, guideSlug, guides } from "@/lib/guides";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ButtonLink, Heading, Prose, Section } from "@/components/ui";
import { FinalCta } from "@/components/sections/FinalCta";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    guides.map((guide) => ({ locale, guideSlug: guideSlug(guide.id, locale) })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: "en" | "es"; guideSlug: string }>;
}) {
  const { locale, guideSlug: slug } = await params;
  const id = guideIdFromSlug(slug);
  if (!id) return {};
  const t = await getTranslations({ locale, namespace: `guides.${id}` });
  return buildMetadata({
    locale,
    pathname: "/guides/[guideSlug]",
    params: { guideSlug: id },
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ locale: "en" | "es"; guideSlug: string }>;
}) {
  const { locale, guideSlug: slug } = await params;
  setRequestLocale(locale);
  const id = guideIdFromSlug(slug);
  if (!id) notFound();

  const t = await getTranslations({ locale, namespace: `guides.${id}` });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tCta = await getTranslations({ locale, namespace: "nav" });
  const body = t.raw("body") as string[];

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale as Locale}
        items={[
          { name: tNav("home"), pathname: "/" },
          { name: tNav("guides"), pathname: "/guides" },
          { name: t("heading"), pathname: "/guides/[guideSlug]" },
        ]}
      />

      <Section>
        <article>
          <header className="max-w-prose">
            <Heading as="h1">{t("heading")}</Heading>
          </header>
          <div className="mt-8">
            <Prose>
              {body.map((paragraph, i) => (
                <p key={i} className="text-pretty">
                  {paragraph}
                </p>
              ))}
            </Prose>
          </div>
          <div className="mt-12 border-t border-[var(--color-border)] pt-8">
            <ButtonLink href="/book">{tCta("book")}</ButtonLink>
          </div>
        </article>
      </Section>

      <FinalCta />
    </>
  );
}
