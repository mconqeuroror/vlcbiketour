import Image from "next/image";
import { useTranslations } from "next-intl";
import { ButtonLink, Eyebrow, Heading, Section } from "@/components/ui";

export function IntroSection() {
  const t = useTranslations("home.intro");
  const tImages = useTranslations("images");

  return (
    <Section>
      <div className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
        <div>
          <Image
            src="/images/old-town-cyclists.webp"
            alt={tImages("oldTownCyclistsAlt")}
            width={209}
            height={169}
            className="h-auto w-full max-w-[520px] rounded-[16px]"
          />
        </div>
        <div>
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading as="h2">{t("heading")}</Heading>
          <p className="mt-5 max-w-prose text-[17px] leading-relaxed text-[var(--color-brand-charcoal)]">
            {t("body")}
          </p>
          <div className="mt-8">
            <ButtonLink href="/valencia-group-bike-tour">{t("cta")}</ButtonLink>
          </div>
        </div>
      </div>
    </Section>
  );
}
