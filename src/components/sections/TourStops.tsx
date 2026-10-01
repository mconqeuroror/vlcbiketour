"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cityStops } from "@/config/city-route";
import credits from "@/config/stop-photo-credits.json";
import { Heading } from "@/components/ui";

const RouteMap = dynamic(() => import("@/components/tours/RouteMap"), { ssr: false });

export function TourStops() {
  const [activeStop, setActiveStop] = useState(0);
  const t = useTranslations("tours.valencia-group-tour");
  const ui = useTranslations("tourExplorer");
  const stop = cityStops[activeStop];
  const photo = credits[stop.photoId as keyof typeof credits];
  const reveal = (id: string) => requestAnimationFrame(() => {
    const target = document.getElementById(id);
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ behavior: "instant", block: "start" });
  });
  const selectFromMap = (index: number) => {
    setActiveStop(index);
    if (window.matchMedia("(max-width: 1023px)").matches) reveal("active-stop-detail");
  };
  const selectFromPhotos = (index: number) => {
    setActiveStop(index);
    reveal(window.matchMedia("(max-width: 1023px)").matches ? "active-stop-detail" : "route-visual");
  };
  const photoAlt = activeStop === 13 ? ui("meetingPhoto") : t(`stops.${activeStop}.name`);

  return (
    <section aria-labelledby="route-heading" className="mt-10" data-testid="city-route">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading as="h3" className="text-[28px]"><span id="route-heading">{t("stopsTitle")}</span></Heading>
        <p className="text-sm font-semibold text-[var(--color-brand-forest)]">{ui("routeStats")}</p>
      </div>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-[var(--color-text-muted)]">{ui("mapIntro")}</p>
      <div id="route-visual" tabIndex={-1} className="mt-6 scroll-mt-28 grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div id="route-map-frame" tabIndex={-1} className="scroll-mt-28"><RouteMap activeStop={activeStop} onStopSelect={selectFromMap} /></div>
        <article id="active-stop-detail" tabIndex={-1} className="scroll-mt-28 overflow-hidden rounded-[var(--radius-image)] border border-[var(--color-border)] bg-white" aria-live="polite" aria-atomic="true" data-testid="active-stop">
          <div className="relative aspect-[3/2]">
            <Image key={stop.id} src={stop.image} alt={photoAlt} fill sizes="(min-width: 1024px) 400px, 100vw" className="object-cover" />
            <span className="absolute start-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-orange)] font-bold text-[var(--color-brand-ink)]" aria-hidden="true">{activeStop + 1}</span>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">{ui("stopOf", { current: activeStop + 1, total: cityStops.length })}</p>
            <h4 className="mt-2 text-xl font-semibold leading-snug text-[var(--color-brand-ink)]">{t(`stops.${activeStop}.name`)}</h4>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-text-muted)]">{t(`stops.${activeStop}.text`)}</p>
            {activeStop === 13 && <p className="mt-3 text-sm leading-relaxed">{ui("meetingPhoto")}</p>}
            <p className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {photo ? <><a href={photo.sourcePage} target="_blank" rel="noopener noreferrer" className="underline">{photo.author}</a>{" · "}<a href={photo.licenseUrl || photo.sourcePage} target="_blank" rel="noopener noreferrer" className="underline">{photo.license}</a></> : <a href="/images/SOURCES.md" target="_blank" rel="noopener noreferrer" className="underline">{ui("existingPhoto")}</a>}
            </p>
            <button type="button" onClick={() => reveal("route-map-frame")} className="mt-3 min-h-11 text-sm font-semibold text-[var(--color-link)] underline lg:hidden">{ui("showOnMap")}</button>
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={activeStop === 0} onClick={() => setActiveStop((i) => i - 1)} className="min-h-11 flex-1 rounded-full border border-[var(--color-border)] px-4 text-sm font-semibold disabled:opacity-40">{ui("previous")}</button>
              <button type="button" disabled={activeStop === cityStops.length - 1} onClick={() => setActiveStop((i) => i + 1)} className="min-h-11 flex-1 rounded-full border border-[var(--color-border)] px-4 text-sm font-semibold disabled:opacity-40">{ui("next")}</button>
            </div>
          </div>
        </article>
      </div>
      <ol className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label={ui("allStops")}>
        {cityStops.map((item, i) => (
          <li key={item.id}>
            <button type="button" aria-pressed={activeStop === i} onClick={() => selectFromPhotos(i)} className={`h-full w-full overflow-hidden rounded-xl border-2 bg-white text-start ${activeStop === i ? "border-[var(--color-brand-ink)]" : "border-transparent hover:border-[var(--color-border)]"}`}>
              <div className="relative aspect-[16/9] overflow-hidden rounded-t-[10px]">
                <Image src={item.image} alt="" fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 45vw" className="object-cover" />
                <span className={`absolute start-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${activeStop === i ? "bg-[var(--color-brand-orange)] text-[var(--color-brand-ink)]" : "bg-white text-[var(--color-brand-ink)]"}`}>{i + 1}</span>
              </div>
              <span className="block px-3 py-3 text-sm font-semibold leading-snug">{t(`stops.${i}.name`)}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-6 max-w-prose text-sm leading-relaxed text-[var(--color-text-muted)]">{t("routeConditions")}</p>
      <details className="mt-4 text-xs leading-relaxed text-[var(--color-text-muted)]">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold">{ui("credits")}</summary>
        <p>{ui("photoChanges")}</p>
        <ul className="mt-3 space-y-2">{cityStops.map((item, i) => {
          const credit = credits[item.photoId as keyof typeof credits];
          return <li key={item.id}>{t(`stops.${i}.name`)}: {credit ? <><a href={credit.sourcePage} className="underline" target="_blank" rel="noopener noreferrer">{credit.author}</a>{" · "}<a href={credit.licenseUrl || credit.sourcePage} className="underline" target="_blank" rel="noopener noreferrer">{credit.license}</a></> : <a href="/images/SOURCES.md" className="underline">{ui("existingPhoto")}</a>}</li>;
        })}</ul>
      </details>
    </section>
  );
}
