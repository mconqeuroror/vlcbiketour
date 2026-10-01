import Image from "next/image";
import { useTranslations } from "next-intl";
import { Heading, Section } from "@/components/ui";

export function EditorialPair() {
  const t = useTranslations("home.editorial");
  const tImages = useTranslations("images");

  return (
    <Section>
      <div className="grid items-stretch gap-5 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[260px] overflow-hidden rounded-[16px] md:min-h-[350px]">
          <Image
            src="/images/home-editorial-left--greenway-cyclists.webp"
            alt={tImages("greenwayCyclistsAlt")}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center rounded-[16px] bg-[#DCE5D8] p-8 md:p-11">
          <Heading as="h2" className="font-bold text-[#163F35]">
            {t("heading")}
          </Heading>
          <div className="my-5 h-[3px] w-10 bg-[#163F35]" aria-hidden="true" />
          <p className="text-[15px] text-[#163F35]/80">{t("support")}</p>
        </div>
      </div>
    </Section>
  );
}
