import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "./ui";

export function Footer() {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const year = new Date().getFullYear();

  const explore = [
    { href: "/valencia-group-bike-tour", label: tNav("tour") },
    { href: "/about", label: tNav("about") },
    { href: "/guides", label: tNav("guides") },
    { href: "/faq", label: tNav("faq") },
    { href: "/contact", label: tNav("contact") },
  ] as const;

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/cookies", label: t("cookies") },
    { href: "/booking-terms", label: t("bookingTerms") },
  ] as const;

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-brand-sand)]">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <Link href="/" aria-label={tNav("home")} className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG lockup */}
              <img
                src="/brand/logo-horizontal.svg"
                alt="biketourvlc — Valencia"
                width={154}
                height={33}
                className="h-auto w-[154px]"
              />
            </Link>
            <p className="mt-3 max-w-xs text-sm text-[var(--color-text-muted)]">
              {t("tagline")}
            </p>
          </div>
          <nav aria-label={t("explore")}>
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
              {t("explore")}
            </p>
            <ul className="mt-3 space-y-2">
              {explore.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1.5 text-sm text-[var(--color-brand-charcoal)] no-underline hover:underline underline-offset-4"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={t("legal")}>
            <p className="text-sm font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
              {t("legal")}
            </p>
            <ul className="mt-3 space-y-2">
              {legal.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="inline-block py-1.5 text-sm text-[var(--color-brand-charcoal)] no-underline hover:underline underline-offset-4"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="mt-10 border-t border-[var(--color-border)] pt-6 text-sm text-[var(--color-text-muted)]">
          {t("copyright", { year })}
        </p>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {t("photoCredits")}{" "}
          <a href="/images/SOURCES.md" className="underline underline-offset-4">
            {t("photoCreditsLink")}
          </a>
        </p>
      </Container>
    </footer>
  );
}
