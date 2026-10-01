import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MobileNav } from "./MobileNav";

/**
 * Approved board header: slim white bar (~76px desktop / 64px mobile),
 * compact wordmark left, five nav links, EN/ES switch, orange pill CTA.
 */
export function Header() {
  const t = useTranslations("nav");

  const links = [
    { href: "/valencia-group-bike-tour", label: t("tour") },
    { href: "/about", label: t("about") },
    { href: { pathname: "/", hash: "groups" }, label: t("groups") },
    { href: "/faq", label: t("faq") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex min-h-[var(--header-height)] w-full max-w-[var(--container)] items-center justify-between gap-6 px-[var(--gutter)]">
        <Link href="/" aria-label={t("home")} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- brand SVG lockup; preserve aspect, no next/image */}
          <img
            src="/brand/logo-horizontal.svg"
            alt="biketourvlc — Valencia"
            width={176}
            height={37}
            className="h-auto w-[136px] sm:w-[154px] md:w-[176px]"
          />
        </Link>

        <nav aria-label={t("home")} className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href as never}
              className="text-[15px] font-medium text-[var(--color-brand-charcoal)] no-underline hover:text-[var(--color-brand-ink)] hover:underline underline-offset-4"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <Link
            href="/book"
            className="hidden min-h-12 items-center rounded-[var(--radius-pill)] bg-[var(--color-brand-orange)] px-5 py-3 text-[15px] font-semibold leading-snug text-[var(--color-brand-ink)] no-underline transition-colors hover:bg-[var(--color-brand-orange-hover)] sm:inline-flex"
          >
            {t("book")}
          </Link>
          <MobileNav links={links} bookLabel={t("book")} />
        </div>
      </div>
    </header>
  );
}
