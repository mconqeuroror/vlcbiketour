"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { guideIdFromSlug, guideSlug } from "@/lib/guides";
import { useSelectedTour } from "./tours/useSelectedTour";
import { tourHash } from "@/config/city-route";

/**
 * Dropdown language switcher — opens the EQUIVALENT page in the chosen
 * locale, never the homepage. For guide articles it maps the localized slug
 * through the explicit guideSlugs table. Keyboard: Escape closes and focus
 * returns to the trigger.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const selectedTour = useSelectedTour();
  const pathname = usePathname() as AppPathname;
  const params = useParams();
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  function hrefFor(l: Locale) {
    let href: { pathname: AppPathname; params?: Record<string, string>; hash?: string } = {
      pathname,
    };
    if (pathname === "/guides/[guideSlug]" && typeof params.guideSlug === "string") {
      const id = guideIdFromSlug(params.guideSlug);
      if (id) href = { pathname, params: { guideSlug: guideSlug(id, l) } };
    }
    if (pathname === "/valencia-group-bike-tour" && selectedTour) href.hash = tourHash(selectedTour).slice(1);
    return href;
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languageSwitcherLabel")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-sm font-semibold uppercase text-[var(--color-brand-charcoal)] hover:bg-[var(--color-brand-sand)]"
      >
        {locale}
        <ChevronDown size={16} aria-hidden className={open ? "rotate-180" : ""} />
      </button>
      {open ? (
        <ul
          role="listbox"
          aria-label={t("languageSwitcherLabel")}
          className="absolute end-0 top-full z-50 mt-1 min-w-40 rounded-[var(--radius-field)] border border-[var(--color-border)] bg-white py-1 shadow-[var(--shadow-card)]"
        >
          {routing.locales.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <Link
                href={hrefFor(l) as never}
                locale={l}
                onClick={() => setOpen(false)}
                className={`block min-h-11 px-4 py-2.5 text-sm no-underline ${
                  l === locale
                    ? "font-semibold text-[var(--color-brand-ink)]"
                    : "text-[var(--color-brand-charcoal)] hover:bg-[var(--color-brand-sand)]"
                }`}
              >
                {t(`languages.${l}`)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
