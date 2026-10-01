import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heading, Section } from "@/components/ui";
import { FaqList } from "./FaqList";

export function FaqTeaser() {
  const t = useTranslations("home.faqTeaser");

  return (
    <Section className="bg-[var(--color-brand-sand)]">
      <Heading as="h2">{t("title")}</Heading>
      <div className="mt-8">
        <FaqList indices={[0, 1, 2]} />
      </div>
      <p className="mt-8">
        <Link
          href="/faq"
          className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--color-link)] no-underline hover:underline"
        >
          {t("cta")}
        </Link>
      </p>
    </Section>
  );
}
