import Image from "next/image";
import { useTranslations } from "next-intl";
import { Section } from "@/components/ui";

export function CoastalBand() {
  const t = useTranslations("home.coastal");
  const tImages = useTranslations("images");

  return (
    <Section>
      <div className="relative min-h-[260px] overflow-hidden rounded-[16px] md:min-h-[320px]">
        <Image
          src="/images/home-coastal-band--beach-day.webp"
          alt={tImages("beachDayAlt")}
          fill
          sizes="(min-width: 1120px) 1120px, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[rgb(11_22_38/0.45)]" aria-hidden="true" />
        <div className="relative flex h-full min-h-[inherit] items-end justify-start p-8 md:items-center md:justify-end md:p-12">
          <p className="max-w-[380px] text-[24px] font-semibold leading-snug text-white">
            {t("quote")}
          </p>
        </div>
      </div>
    </Section>
  );
}
