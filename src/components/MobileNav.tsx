"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Menu, X } from "lucide-react";

interface NavLink {
  href: unknown;
  label: string;
}

/**
 * Mobile menu: 44×44 trigger, Escape closes, focus returns to the trigger,
 * and focus moves into the panel on open. Locale switch lives inside.
 */
export function MobileNav({
  links,
  bookLabel,
}: {
  links: NavLink[];
  bookLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("a");
    first?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-brand-ink)]"
      >
        {open ? <X size={24} aria-hidden /> : <Menu size={24} aria-hidden />}
      </button>
      {open ? (
        <nav
          id="mobile-nav"
          ref={panelRef}
          aria-label={t("home")}
          className="absolute inset-x-0 top-[var(--header-height)] z-50 border-b border-[var(--color-border)] bg-white px-[var(--gutter)] pb-6 pt-2 shadow-[var(--shadow-card)]"
        >
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  href={l.href as never}
                  onClick={() => setOpen(false)}
                  className="block min-h-12 rounded-[var(--radius-sm)] px-2 py-3 text-base font-medium text-[var(--color-brand-ink)] no-underline hover:bg-[var(--color-brand-sand)]"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="px-2 py-2">
              <LanguageSwitcher />
            </li>
            <li>
              <Link
                href="/book"
                onClick={() => setOpen(false)}
                className="mt-2 flex min-h-12 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-orange)] px-5 py-3 text-base font-semibold text-[var(--color-brand-ink)] no-underline"
              >
                {bookLabel}
              </Link>
            </li>
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
