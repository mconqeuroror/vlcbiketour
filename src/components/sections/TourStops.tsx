import Image from "next/image";
import { useTranslations } from "next-intl";
import { Heading, Section } from "@/components/ui";
import { defaultTour } from "@/config/tours";

// Temporary concept crops from the approved design kit (see
// public/images/SOURCES.md) — replacement with operator photography required.
const stopImages = [
  { src: "/images/greenway-cyclists.webp", altKey: "greenwayCyclistsAlt" },
  { src: "/images/arts-and-sciences.webp", altKey: "cacAlt" },
  { src: "/images/old-town-cyclists.webp", altKey: "oldTownCyclistsAlt" },
  { src: "/images/oranges-old-town.webp", altKey: "orangesOldTownAlt" },
  { src: "/images/group-ride.webp", altKey: "groupRideAlt" },
] as const;

export function TourStops() {
  const t = useTranslations("tours.valencia-group-tour");
  const tImages = useTranslations("images");

  const stops = Array.from({ length: defaultTour.stopCount }, (_, i) => i);

  return (
    <Section className="border-t border-[var(--color-border)]">
      <Heading as="h2">{t("stopsTitle")}</Heading>
      <ol className="mt-12 space-y-14">
        {stops.map((i) => {
          const image = stopImages[i];
          const reversed = i % 2 === 1;
          return (
            <li key={i} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
              <div
                className={`relative aspect-[3/2] overflow-hidden rounded-[var(--radius-image)] border border-[var(--color-border)] ${
                  reversed ? "md:order-2" : ""
                }`}
              >
                <Image
                  src={image.src}
                  alt={tImages(image.altKey)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className={reversed ? "md:order-1" : ""}>
                <p
                  className="text-sm font-semibold tracking-widest text-[var(--color-link)]"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <Heading as="h3" className="mt-2">
                  {t(`stops.${i}.name`)}
                </Heading>
                <p className="mt-3 max-w-prose text-[17px] leading-relaxed text-[var(--color-text-muted)]">
                  {t(`stops.${i}.text`)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
