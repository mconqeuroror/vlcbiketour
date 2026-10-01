import { guideSlugs, type Locale, routing } from "@/i18n/routing";

export interface Guide {
  id: keyof typeof guideSlugs;
  /** Message key under guides.<id> */
  id_string: string;
}

export const guides: { id: string }[] = Object.keys(guideSlugs).map((id) => ({ id }));

/** Localized public slug for a guide id. */
export function guideSlug(id: string, locale: Locale): string {
  return guideSlugs[id]?.[locale] ?? id;
}

/** Reverse lookup: localized slug (any locale) → internal guide id. */
export function guideIdFromSlug(slug: string): string | undefined {
  for (const [id, slugs] of Object.entries(guideSlugs)) {
    if (Object.values(slugs).includes(slug)) return id;
  }
  return undefined;
}

export { routing };
