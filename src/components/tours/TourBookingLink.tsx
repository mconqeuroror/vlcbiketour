"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { useTourBookingHref } from "./useSelectedTour";

export function TourBookingLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const href = useTourBookingHref();
  return <Link {...props} href={href} />;
}
