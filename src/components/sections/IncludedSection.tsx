import { useTranslations } from "next-intl";
import { Bike, Droplets, ShieldCheck, Users } from "lucide-react";
import { Heading, Section } from "@/components/ui";
import { defaultTour } from "@/config/tours";

const inclusionIcons = {
  bike: Bike,
  helmet: ShieldCheck,
  guide: Users,
  water: Droplets,
} as const;

const needToKnowKeys = ["clothing", "fitness", "weather", "groupOnly"] as const;

export function IncludedSection() {
  const t = useTranslations("home.included");

  return (
    <Section className="border-t border-[var(--color-border)]">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Heading as="h2">{t("title")}</Heading>
          <ul className="mt-8 space-y-5">
            {defaultTour.inclusions.map((key) => {
              const IconComponent = inclusionIcons[key as keyof typeof inclusionIcons];
              return (
                <li key={key} className="flex items-start gap-3">
                  {IconComponent ? (
                    <IconComponent
                      className="mt-1 h-5 w-5 shrink-0 text-[var(--color-brand-ink)]"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="text-[17px] leading-relaxed text-[var(--color-brand-ink)]">
                    {t(`items.${key}`)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)] sm:p-8">
          <Heading as="h3">{t("needToKnowTitle")}</Heading>
          <ul className="mt-6 list-disc space-y-3 pl-5 text-[17px] leading-relaxed text-[var(--color-text-muted)]">
            {needToKnowKeys.map((key) => (
              <li key={key}>{t(`needToKnow.${key}`)}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
