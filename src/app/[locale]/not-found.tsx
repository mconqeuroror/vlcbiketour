import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ButtonLink, Heading, Section } from "@/components/ui";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "notFound" });

  return (
    <Section>
      <div className="max-w-prose py-10">
        <Heading as="h1">{t("heading")}</Heading>
        <p className="mt-5 text-lg leading-relaxed text-pretty text-[var(--color-brand-charcoal)]">
          {t("text")}
        </p>
        <div className="mt-8">
          <ButtonLink href="/">{t("cta")}</ButtonLink>
        </div>
      </div>
    </Section>
  );
}
