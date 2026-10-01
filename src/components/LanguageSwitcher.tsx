"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { guideIdFromSlug, guideSlug } from "@/lib/guides";

/**
 * Language switcher that opens the EQUIVALENT page in the other locale —
 * never the homepage. For guide articles it maps the localized slug through
 * the explicit guideSlugs table.
 */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname() as AppPathname;
  const params = useParams();
  const t = useTranslations("nav");

  const other: Locale = locale === "en" ? "es" : "en";

  let href: { pathname: AppPathname; params?: Record<string, string> } = {
    pathname,
  };
  if (pathname === "/guides/[guideSlug]" && typeof params.guideSlug === "string") {
    const id = guideIdFromSlug(params.guideSlug);
    if (id) {
      href = { pathname, params: { guideSlug: guideSlug(id, other) } };
    }
  }

  return (
    <nav aria-label={t("languageSwitcherLabel")} className="flex items-center gap-1 text-sm font-medium">
      {routing.locales.map((l) =>
        l === locale ? (
          <span
            key={l}
            aria-current="true"
            className="rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-ink-500)]"
          >
            {t(`switchTo.${l}`)}
          </span>
        ) : (
          <Link
            key={l}
            href={href as never}
            locale={l}
            className="rounded-[var(--radius-sm)] px-2 py-1 text-[var(--color-accent-700)] underline-offset-4 hover:underline"
          >
            {t(`switchTo.${l}`)}
          </Link>
        ),
      )}
    </nav>
  );
}
