"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Mobile-only sticky booking CTA (orange pill per approved board). Respects
 * safe-area insets and hides while the footer is on screen so it never covers
 * form fields or consent controls; never rendered on the booking page.
 */
export function StickyBookingCta() {
  const t = useTranslations();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const sentinel = document.querySelector("[data-sticky-cta-hide]");
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHidden(entry.isIntersecting),
      { rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pathname]);

  if (/\/(book|reservar|reserver)\/?$/.test(pathname) || hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden">
      <Link
        href="/book"
        className="flex min-h-12 w-full items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-orange)] px-5 py-3 text-base font-semibold text-[var(--color-brand-ink)] no-underline"
      >
        {t("stickyCta")}
      </Link>
    </div>
  );
}
