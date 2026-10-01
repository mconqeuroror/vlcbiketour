import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";

/* public/icons/chevron-down.svg inlined so it follows currentColor. */
function ChevronDownIcon(props: ComponentProps<"svg">) {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function FaqList({ indices }: { indices: number[] }) {
  const t = useTranslations("faq.items");

  return (
    <div className="border-b border-[var(--color-border)]">
      {indices.map((i) => (
        <details key={i} className="group border-t border-[var(--color-border)] py-5">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-balance text-[var(--color-brand-ink)] md:text-[17px] [&::-webkit-details-marker]:hidden">
            {t(`${i}.q`)}
            <ChevronDownIcon className="h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 group-open:rotate-180" />
          </summary>
          <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[var(--color-text-muted)] md:text-base">
            {t(`${i}.a`)}
          </p>
        </details>
      ))}
    </div>
  );
}
