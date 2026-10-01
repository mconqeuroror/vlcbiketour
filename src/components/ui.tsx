import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--container)] px-[var(--gutter)] ${className}`}
    >
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-[var(--section-space)] ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

/*
 * Approved board buttons: pill radius, min 48px tall, ink text on orange
 * (white on bright orange fails ordinary-text contrast), white secondary.
 */
const baseButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 py-3 text-[15px] font-semibold leading-snug no-underline transition-colors duration-150";

const variants = {
  primary:
    "bg-[var(--color-brand-orange)] text-[var(--color-brand-ink)] hover:bg-[var(--color-brand-orange-hover)]",
  secondary:
    "bg-white text-[var(--color-brand-ink)] border border-[var(--color-border)] hover:bg-[var(--color-brand-sand)]",
  forest: "bg-[var(--color-brand-forest)] text-white hover:bg-[#1d5143]",
} as const;

export type ButtonVariant = keyof typeof variants;

export function ButtonLink({
  children,
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  className?: string;
}) {
  return (
    <Link className={`${baseButton} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function buttonStyles(variant: ButtonVariant = "primary") {
  return `${baseButton} ${variants[variant]} disabled:opacity-60`;
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">
      {children}
    </p>
  );
}

export function Heading({
  as: Tag = "h2",
  children,
  className = "",
}: {
  as?: "h1" | "h2" | "h3";
  children: ReactNode;
  className?: string;
}) {
  const sizes = {
    h1: "text-[clamp(40px,5vw,68px)] font-bold leading-[1.04] tracking-[-0.045em]",
    h2: "text-[clamp(30px,3.3vw,42px)] font-semibold leading-[1.12] tracking-[-0.035em]",
    h3: "text-[23px] font-semibold leading-[1.2] tracking-[-0.025em]",
  } as const;
  return (
    <Tag className={`${sizes[Tag]} text-balance text-[var(--color-brand-ink)] ${className}`}>
      {children}
    </Tag>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-prose space-y-4 text-[17px] leading-relaxed text-[var(--color-brand-charcoal)]">
      {children}
    </div>
  );
}
