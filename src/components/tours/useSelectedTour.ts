"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "@/i18n/navigation";
import { tourIdFromHash } from "@/config/city-route";

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => { window.removeEventListener("hashchange", listener); window.removeEventListener("popstate", listener); };
}
function currentSelection() { return tourIdFromHash(window.location.hash); }
function serverSelection() { return null; }

export function useSelectedTour() {
  return useSyncExternalStore(subscribe, currentSelection, serverSelection);
}

export function useTourBookingHref() {
  const selected = useSelectedTour();
  const pathname = usePathname();
  return selected && pathname === "/valencia-group-bike-tour"
    ? { pathname: "/book" as const, query: { tour: selected } }
    : "/book" as const;
}
