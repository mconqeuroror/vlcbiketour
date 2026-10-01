"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { tours, getTour } from "@/config/tours";
import { tourHash } from "@/config/city-route";
import { ButtonLink, Heading, Section } from "@/components/ui";
import { TourOffers } from "@/components/sections/TourOffers";
import { TourStops } from "@/components/sections/TourStops";
import { useSelectedTour } from "./useSelectedTour";

const photos = {
  shared: "/images/home-hero-primary--cyclists-panorama.webp",
  city: "/images/home-about-left--old-town-cyclists.webp",
  architecture: "/images/city-highlights-gallery--oranges-old-town.webp",
};

export function TourExplorer() {
  const selectedId = useSelectedTour();
  const selected = selectedId ? getTour(selectedId) : undefined;
  const t = useTranslations("tourExplorer");
  const offers = useTranslations("offers");
  const cards = useTranslations("home.experiences");
  const nav = useTranslations("nav");
  const choose = (id: string) => {
    if (id !== selectedId) {
      window.history.pushState(null, "", tourHash(id));
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }
    requestAnimationFrame(() => {
      const panel = document.getElementById("selected-tour");
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  };

  return (
    <Section id="tour-selection" className="!pt-8 sm:!pt-10">
      <div id="private-tours" className="scroll-mt-28" />
      <p className="max-w-prose text-[17px] text-[var(--color-text-muted)]">{t("chooseHint")}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-3" role="group" aria-label={t("chooseLabel")}>
        {tours.map((tour) => {
          const isSelected = tour.id === selectedId;
          return <button key={tour.id} id={tourHash(tour.id).slice(1)} type="button" aria-pressed={isSelected} aria-controls={isSelected ? "selected-tour" : undefined} onClick={() => choose(tour.id)} className={`group flex h-full scroll-mt-28 flex-col overflow-hidden rounded-[var(--radius-card)] border-2 bg-white text-start transition-colors duration-150 ${isSelected ? "border-[var(--color-brand-ink)]" : "border-[var(--color-border)] hover:border-[var(--color-brand-olive)]"}`}>
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image src={photos[tour.key]} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" priority />
              <span aria-hidden="true" className={`absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border-2 ${isSelected ? "border-[var(--color-brand-ink)] bg-[var(--color-brand-orange)]" : "border-white bg-white/90"}`}>{isSelected ? "✓" : ""}</span>
            </div>
            <div className="flex flex-1 flex-col p-5 lg:p-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{t("duration")}</span>
              <span className="mt-3 text-[22px] font-semibold leading-snug tracking-[-0.015em]">{offers(`${tour.key}.name`)}</span>
              <span className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-muted)]">{cards(`${tour.key}.text`)}</span>
              <span className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{tour.guideLanguages.map((language) => nav(`languages.${language}`)).join(" · ")}</span>
              <span className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm font-semibold text-[var(--color-brand-ink)]">{isSelected ? t("selected") : t("selectTour")}<span aria-hidden="true">{isSelected ? "✓" : "+"}</span></span>
            </div>
          </button>;
        })}
      </div>
      <p className="sr-only" aria-live="polite">{selected ? t("selectionAnnouncement", { tour: offers(`${selected.key}.name`) }) : t("chooseHint")}</p>
      {selected && <div id="selected-tour" tabIndex={-1} role="region" aria-labelledby="selected-tour-heading" className="mt-12 scroll-mt-28 border-t border-[var(--color-border)] pt-10" key={selected.id} data-testid="selected-tour">
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row">
          <div className="max-w-[680px]">
            <a href="#tour-selection" className="mb-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--color-link)] underline">{t("changeTour")}</a>
            <Heading as="h2"><span id="selected-tour-heading">{offers(`${selected.key}.name`)}</span></Heading>
            <p className="mt-4 text-[17px] leading-relaxed text-[var(--color-text-muted)]">{offers(`${selected.key}.description`)}</p>
          </div>
          <ButtonLink href={{ pathname: "/book", query: { tour: selected.id } }} className="shrink-0">{offers(`${selected.key}.cta`)}</ButtonLink>
        </div>
        {selected.key === "architecture" ? <section className="mt-9 grid gap-7 rounded-[var(--radius-image)] bg-[var(--color-brand-sand)] p-6 sm:grid-cols-[1fr_1.2fr] sm:p-8" aria-labelledby="architecture-route-title">
          <div className="relative min-h-56 overflow-hidden rounded-xl"><Image src={photos.architecture} alt={t("architectureImage")} fill sizes="(min-width: 640px) 40vw, 100vw" className="object-cover" /></div>
          <div className="self-center"><Heading as="h3"><span id="architecture-route-title">{t("architectureRouteTitle")}</span></Heading><p className="mt-4 text-[17px] leading-relaxed">{t("architectureRouteNote")}</p></div>
        </section> : <TourStops />}
        <TourOffers tour={selected} />
      </div>}
      <noscript><p className="mt-6 text-[17px]">{t("noScript")}</p><div className="mt-4 flex flex-wrap gap-4">{tours.map((tour) => <ButtonLink key={tour.id} href={{ pathname: "/book", query: { tour: tour.id } }}>{offers(`${tour.key}.cta`)}</ButtonLink>)}</div></noscript>
    </Section>
  );
}
