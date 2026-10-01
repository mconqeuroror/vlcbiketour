import { useTranslations } from "next-intl";

export function LegalSections({
  namespace,
  sectionKeys,
}: {
  namespace: string;
  sectionKeys: string[];
}) {
  const t = useTranslations(namespace);

  return (
    <div className="mt-10 space-y-10">
      {sectionKeys.map((key) => (
        <section
          key={key}
          aria-labelledby={`legal-${key}`}
          className={
            key === "review"
              ? "rounded-[var(--radius-card)] bg-[var(--color-brand-sand)] p-6 sm:p-8"
              : "border-t border-[var(--color-border)] pt-8"
          }
        >
          <h2
            id={`legal-${key}`}
            className="text-[23px] font-semibold leading-[1.2] tracking-[-0.025em] text-balance text-[var(--color-brand-ink)]"
          >
            {t(`sections.${key}.title`)}
          </h2>
          <p className="mt-3 max-w-prose text-[17px] leading-relaxed text-[var(--color-text-muted)]">
            {t(`sections.${key}.text`)}
          </p>
        </section>
      ))}
    </div>
  );
}
