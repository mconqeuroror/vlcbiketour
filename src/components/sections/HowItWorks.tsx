import { useTranslations } from "next-intl";
import { Heading, Section } from "@/components/ui";

const stepKeys = ["1", "2", "3"] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");

  return (
    <Section className="border-t border-[var(--color-border)]">
      <Heading as="h2">{t("title")}</Heading>
      <ol className="mt-10 grid gap-10 sm:grid-cols-3">
        {stepKeys.map((key, i) => (
          <li key={key} className="border-t border-[var(--color-border)] pt-5">
            <p
              className="text-xs font-semibold tracking-[0.13em] text-[var(--color-text-muted)]"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </p>
            <Heading as="h3" className="mt-2">
              {t(`steps.${key}.title`)}
            </Heading>
            <p className="mt-3 text-[17px] leading-relaxed text-[var(--color-text-muted)]">
              {t(`steps.${key}.text`)}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-prose text-sm leading-relaxed text-[var(--color-text-muted)]">
        {t("note")}
      </p>
    </Section>
  );
}
