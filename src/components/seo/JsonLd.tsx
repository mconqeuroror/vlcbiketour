import { getTranslations } from "next-intl/server";
import { operator } from "@/config/operator";
import { defaultTour } from "@/config/tours";
import { localizedUrl, siteUrl } from "@/lib/seo/metadata";
import type { AppPathname, Locale } from "@/i18n/routing";

const ORGANIZATION_ID = `${siteUrl}/#organization`;
const WEBSITE_ID = `${siteUrl}/#website`;

type JsonLdData = Record<string, unknown>;

/** Raw JSON-LD script tag. `data` must be plain JSON-serializable. */
export function JsonLdScript({ data }: { data: JsonLdData }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  const { email, phone, legalName, address } = operator.contact;
  const data: JsonLdData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: operator.brandName,
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    // Optional fields only when real — never emit nulls as facts.
    ...(legalName ? { legalName } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { telephone: phone } : {}),
    ...(address
      ? { address: { "@type": "PostalAddress", streetAddress: address } }
      : {}),
    ...(operator.social.length > 0 ? { sameAs: [...operator.social] } : {}),
  };
  return <JsonLdScript data={data} />;
}

// locale is accepted (optional) for a uniform call signature; the WebSite
// payload itself is site-wide and identical in both locales.
export async function WebSiteJsonLd({ locale }: { locale?: Locale } = {}) {
  void locale;
  const data: JsonLdData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteUrl,
    name: operator.brandName,
    inLanguage: ["en", "es", "fr", "ar"],
    publisher: { "@id": ORGANIZATION_ID },
  };
  return <JsonLdScript data={data} />;
}

export interface BreadcrumbItem {
  name: string;
  pathname: AppPathname;
}

export async function BreadcrumbJsonLd({
  locale,
  items,
}: {
  locale: Locale;
  items: BreadcrumbItem[];
}) {
  const t = await getTranslations({ locale, namespace: "nav" });
  const crumbs = [{ name: t("home"), pathname: "/" as AppPathname }, ...items];
  const data: JsonLdData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: localizedUrl(locale, crumb.pathname),
    })),
  };
  return <JsonLdScript data={data} />;
}

export async function TouristTripJsonLd({ locale }: { locale: Locale }) {
  const t = await getTranslations({
    locale,
    namespace: `tours.${defaultTour.id}`,
  });
  const data: JsonLdData = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: t("name"),
    description: t("metaDescription"),
    touristType: t("audience"),
    itinerary: {
      "@type": "ItemList",
      numberOfItems: defaultTour.stopCount,
      itemListElement: Array.from({ length: defaultTour.stopCount }, (_, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "TouristDestination",
          name: t(`stops.${i}.name`),
        },
      })),
    },
    provider: { "@id": ORGANIZATION_ID },
    location: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Casa Fenicia, Calle Corretgeria 4",
        postalCode: "46001",
        addressLocality: "Valencia",
        addressCountry: "ES",
      },
    },
  };
  return <JsonLdScript data={data} />;
}
