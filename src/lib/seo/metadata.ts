import type { Metadata } from "next";
import { operator } from "@/config/operator";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";
import { guideSlugs } from "@/i18n/routing";

const siteUrl = operator.siteUrl.replace(/\/$/, "");

/** Absolute localized URL for an internal pathname (with trailing slash). */
export function localizedUrl(
  locale: Locale,
  pathname: AppPathname,
  params?: Record<string, string>,
): string {
  let href = getPathname({ locale, href: { pathname, params } as never });
  // Guide articles: substitute the localized article slug per locale.
  if (params?.guideSlug && guideSlugs[params.guideSlug]) {
    href = href.replace(params.guideSlug, guideSlugs[params.guideSlug][locale]);
  }
  return `${siteUrl}${href}/`.replace(/\/\/$/, "/");
}

interface PageMetaInput {
  locale: Locale;
  pathname: AppPathname;
  params?: Record<string, string>;
  title: string;
  description: string;
  noindex?: boolean;
}

/**
 * Canonical + reciprocal self-inclusive hreflang (es, en, x-default → en).
 * Every localized page references itself; nothing cross-canonicalizes.
 */
export function buildMetadata({
  locale,
  pathname,
  params,
  title,
  description,
  noindex,
}: PageMetaInput): Metadata {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = localizedUrl(l, pathname, params);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, pathname, params);

  return {
    title,
    description,
    alternates: {
      canonical: localizedUrl(locale, pathname, params),
      languages,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: localizedUrl(locale, pathname, params),
      siteName: operator.brandName,
      locale: locale === "es" ? "es_ES" : "en_GB",
      type: "website",
    },
  };
}

export { siteUrl };
