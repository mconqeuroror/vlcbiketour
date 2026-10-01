import { useTranslations } from "next-intl";

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.65,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "h-7 w-7",
} as const;

function GroupsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="6.5" r="2.8" />
      <path d="M6.8 21v-5a5.2 5.2 0 0 1 10.4 0v5M8.5 21h7M4.5 5a2.5 2.5 0 0 0 0 5M19.5 5a2.5 2.5 0 0 1 0 5M4 13a3 3 0 0 0-2 3v4h2M20 13a3 3 0 0 1 2 3v4h-2" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 0 1 14 0Z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}

function LandmarkIcon() {
  return (
    <svg {...iconProps}>
      <path d="M3 21h18M5 21V9l7-6 7 6v12M9 21v-8h6v8M8 9h8M10 3V1h4v2" />
    </svg>
  );
}

function BikeIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="5" cy="17" r="4" />
      <circle cx="19" cy="17" r="4" />
      <path d="m5 17 5-8 5 8H5l-2-11h4M15 17l3-13h-4" />
    </svg>
  );
}

const icons = [GroupsIcon, PinIcon, LandmarkIcon, BikeIcon];

/**
 * Approved board proof strip (section C): plain white band directly under
 * the hero — four evenly spaced icon + label + caption items, 2×2 on mobile.
 */
export function ProofStrip() {
  const t = useTranslations("home.proof");

  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-[var(--container)] grid-cols-2 gap-x-6 gap-y-7 px-[var(--gutter)] py-[30px] md:grid-cols-4">
        {icons.map((Icon, i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-1.5 text-center"
          >
            <span className="text-[var(--color-brand-ink)]">
              <Icon />
            </span>
            <p className="text-[15px] font-semibold leading-snug text-[var(--color-brand-ink)]">
              {t(`${i}.label`)}
            </p>
            <p className="text-[13px] leading-snug text-[var(--color-text-muted)]">
              {t(`${i}.caption`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
