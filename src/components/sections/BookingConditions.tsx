import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heading, Section } from "@/components/ui";

export function BookingConditions() {
  const t = useTranslations("tours.valencia-group-tour");

  return (
    <Section className="border-t border-[var(--color-border)]">
      <div className="max-w-prose">
        <Heading as="h2">{t("conditionsTitle")}</Heading>
        <p className="mt-5 text-[17px] leading-relaxed text-pretty text-[var(--color-text-muted)]">
          {t("requestNote")}
        </p>
        <p className="mt-6">
          <Link
            href="/booking-terms"
            className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--color-link)] no-underline hover:underline"
          >
            {t("conditionsTitle")}
          </Link>
        </p>
      </div>
    </Section>
  );
}
