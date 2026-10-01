import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heading, Section } from "@/components/ui";
import type { ComponentProps, ReactNode } from "react";

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

function WavesIcon(props: ComponentProps<"svg">) {
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
      <path d="M2 7c4-6 6 6 10 0s6 6 10 0M2 12c4-6 6 6 10 0s6 6 10 0M2 17c4-6 6 6 10 0s6 6 10 0" />
    </svg>
  );
}

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

function ArrowRightIcon(props: ComponentProps<"svg">) {
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
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function TourCards() {
  const t = useTranslations("home.experiences");

  const cards: {
    key: "city" | "nature" | "custom";
    icon: (props: ComponentProps<"svg">) => ReactNode;
    href: ComponentProps<typeof Link>["href"];
  }[] = [
    {
      key: "city" as const,
      icon: LandmarkIcon,
      href: "/valencia-group-bike-tour",
    },
    { key: "nature" as const, icon: WavesIcon, href: "/book" },
    { key: "custom" as const, icon: GroupsIcon, href: "/book" },
  ];

  return (
    <Section>
      <Heading as="h2" className="text-center">
        {t("heading")}
      </Heading>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {cards.map(({ key, icon: Icon, href }) => (
          <div
            key={key}
            className="rounded-[16px] border border-[var(--color-border)] bg-white px-7 py-9 text-center shadow-[var(--shadow-card)]"
          >
            <Icon className="mx-auto h-9 w-9 text-[var(--color-brand-ink)]" />
            <h3 className="mt-5 text-[22px] font-semibold leading-snug tracking-[-0.015em] text-[var(--color-brand-ink)]">
              {t(`${key}.title`)}
            </h3>
            <p className="mx-auto mt-2 max-w-[26ch] text-[15px] leading-relaxed text-[var(--color-text-muted)]">
              {t(`${key}.text`)}
            </p>
            <Link
              href={href}
              aria-label={`${t(`${key}.link`)} — ${t(`${key}.title`)}`}
              className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--color-link)] no-underline hover:underline"
            >
              {t(`${key}.link`)}
              <span className="sr-only"> — {t(`${key}.title`)}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
