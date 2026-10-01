import { useTranslations } from "next-intl";
import { ButtonLink, Heading, Section } from "@/components/ui";
import type { ComponentProps } from "react";

function GroupsIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="6.5" r="2.8" />
      <path d="M6.8 21v-5a5.2 5.2 0 0 1 10.4 0v5M8.5 21h7M4.5 5a2.5 2.5 0 0 0 0 5M19.5 5a2.5 2.5 0 0 1 0 5M4 13a3 3 0 0 0-2 3v4h2M20 13a3 3 0 0 1 2 3v4h-2" />
    </svg>
  );
}

function BriefcaseIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="7" width="18" height="14" rx="2" />
      <path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3" />
    </svg>
  );
}

function LandmarkIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-8h6v8M8 9h8M10 3V1h4v2" />
    </svg>
  );
}

function SunIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" />
    </svg>
  );
}

export function GroupBand() {
  const t = useTranslations("home.groupsBand");

  const items = [
    { key: "0", icon: GroupsIcon },
    { key: "1", icon: BriefcaseIcon },
    { key: "2", icon: LandmarkIcon },
    { key: "3", icon: SunIcon },
  ];

  return (
    <Section id="groups">
      <div className="rounded-[16px] bg-[#F2F3ED] p-9 text-center">
        <Heading as="h3">{t("title")}</Heading>
        <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {items.map(({ key, icon: Icon }) => (
            <div key={key}>
              <Icon className="mx-auto h-7 w-7 text-[var(--color-brand-ink)]" />
              <p className="mt-3 text-[15px] font-semibold text-[var(--color-brand-ink)]">
                {t(`${key}.label`)}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {t(`${key}.caption`)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-9">
          <ButtonLink href="/contact" variant="forest">
            {t("cta")}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
