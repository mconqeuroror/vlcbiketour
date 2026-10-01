"use client";

import { useTourBookingHref } from "@/components/tours/useSelectedTour";
import { useTranslations } from "next-intl";
import { ButtonLink, Container, Heading } from "@/components/ui";

export function FinalCta({
  title,
  text,
  cta,
}: {
  title?: string;
  text?: string;
  cta?: string;
}) {
  const t = useTranslations("home.finalCta");
  const bookingHref = useTourBookingHref();

  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--color-brand-sand)]">
      <Container className="py-14 text-center sm:py-20">
        <Heading as="h2" className="mx-auto max-w-2xl">
          {title ?? t("title")}
        </Heading>
        <p className="mx-auto mt-4 max-w-prose text-[17px] leading-relaxed text-pretty text-[var(--color-text-muted)]">
          {text ?? t("text")}
        </p>
        <div className="mt-8">
          <ButtonLink href={bookingHref}>{cta ?? t("cta")}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}
