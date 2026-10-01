import type { MetadataRoute } from "next";
import { localizedUrl } from "@/lib/seo/metadata";
import { routing, type AppPathname, type Locale } from "@/i18n/routing";
import { guideSlugs } from "@/i18n/routing";

const STATIC_PATHNAMES: AppPathname[] = [
  "/",
  "/valencia-group-bike-tour",
  "/about",
  "/faq",
  "/contact",
  "/book",
  "/guides",
  "/privacy",
  "/cookies",
  "/booking-terms",
];

function entry(
  pathname: AppPathname,
  params?: Record<string, string>,
): MetadataRoute.Sitemap[number][] {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = localizedUrl(locale, pathname, params);
  }
  languages["x-default"] = localizedUrl(routing.defaultLocale, pathname, params);

  return routing.locales.map((locale: Locale) => ({
    url: localizedUrl(locale, pathname, params),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: pathname === "/" ? 1 : 0.7,
    alternates: { languages },
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  for (const pathname of STATIC_PATHNAMES) {
    entries.push(...entry(pathname));
  }
  for (const guideId of Object.keys(guideSlugs)) {
    entries.push(...entry("/guides/[guideSlug]", { guideSlug: guideId }));
  }
  return entries;
}
