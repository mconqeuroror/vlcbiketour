import { useTranslations } from "next-intl";
import { Clock, Languages, MapPin, Users } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { Heading, Section } from "@/components/ui";
import { defaultTour } from "@/config/tours";

type Icon = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

function Fact({
  icon: IconComponent,
  label,
  children,
}: {
  icon?: Icon;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-[var(--color-border)] pt-4">
      <dt className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
        {IconComponent ? (
          <IconComponent className="h-4 w-4" aria-hidden="true" />
        ) : null}
        {label}
      </dt>
      <dd className="mt-2 text-[17px] leading-relaxed text-[var(--color-brand-ink)]">{children}</dd>
    </div>
  );
}

export function GlanceFacts() {
  const t = useTranslations("home.glance");
  const tTour = useTranslations("tours.valencia-group-tour");
  const tIncluded = useTranslations("home.included.items");

  return (
    <Section>
      <Heading as="h2">{t("title")}</Heading>
      <dl className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        <Fact icon={MapPin} label={t("location")}>
          {t("locationValue")}
        </Fact>
        <Fact icon={Users} label={t("groupSize")}>
          {t("groupSizeValue")}
        </Fact>
        <Fact icon={Clock} label={t("duration")}>
          {t("durationValue")}
        </Fact>
        <Fact label={t("difficulty")}>{t("difficultyValue")}</Fact>
        <Fact icon={Languages} label={t("languages")}>
          {t("languagesValue")}
        </Fact>
        <Fact label={t("meetingPoint")}>{tTour("meetingPointName")}</Fact>
        <Fact label={t("included")}>
          <ul className="list-disc space-y-1 pl-5">
            {defaultTour.inclusions.map((key) => (
              <li key={key}>{tIncluded(key)}</li>
            ))}
          </ul>
        </Fact>
        <Fact label={t("pricing")}>{t("pricingOnRequest")}</Fact>
        <Fact label={t("bookingConditions")}>{t("bookingConditionsValue")}</Fact>
      </dl>
    </Section>
  );
}
