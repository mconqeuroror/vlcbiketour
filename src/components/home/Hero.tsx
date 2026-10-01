import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ButtonLink, Heading, buttonStyles } from "@/components/ui";

/**
 * Approved board hero (section B): full-width photograph under the header,
 * neutral dark overlay only, white headline + sub, orange primary pill and
 * white secondary pill. Centered on desktop, left-aligned on mobile.
 */
export function Hero() {
  const t = useTranslations("home.hero");
  const tImages = useTranslations("images");

  return (
    <section className="relative flex min-h-[560px] items-center overflow-hidden md:min-h-[clamp(540px,44vw,680px)]">
      <Image
        src="/images/hero-cyclists-concept.webp"
        alt={tImages("heroAlt")}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_59%] md:object-[50%_58%]"
      />
      <div aria-hidden className="absolute inset-0 bg-[rgb(11_22_38/0.37)]" />
      <div className="relative mx-auto w-[min(780px,calc(100%-40px))] py-16 text-left md:text-center">
        <Heading as="h1" className="max-w-[340px] text-white md:max-w-none">
          {t("line1")}
          <br />
          {t("line2")}
        </Heading>
        <p className="mt-5 max-w-[320px] text-[17px] leading-relaxed text-white md:mx-auto md:max-w-[610px] md:text-[19px]">
          {t("sub")}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3 md:justify-center">
          <ButtonLink href="/book">{t("primaryCta")}</ButtonLink>
          <Link
            href="/valencia-group-bike-tour"
            className={buttonStyles("secondary")}
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
