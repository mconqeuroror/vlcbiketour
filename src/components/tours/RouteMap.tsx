"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import type { FeatureCollection } from "geojson";
import { useTranslations } from "next-intl";
import { cityRouteLine, cityStops } from "@/config/city-route";
import "leaflet/dist/leaflet.css";
import styles from "./RouteMap.module.css";

interface Props { activeStop: number; onStopSelect: (index: number) => void; }
const callouts: Record<number, [number, number]> = {
  0: [-44, 20], 1: [38, 14], 2: [0, -27], 3: [-8, -12],
  10: [30, 37], 11: [-54, 48], 12: [-54, 5], 13: [-76, -28],
};

export default function RouteMap({ activeStop, onStopSelect }: Props) {
  const t = useTranslations("tourExplorer");
  const stops = useTranslations("tours.valencia-group-tour.stops");
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const onSelect = useRef(onStopSelect);
  const active = useRef(activeStop);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const lastSelection = useRef(activeStop);
  useEffect(() => { onSelect.current = onStopSelect; active.current = activeStop; }, [onStopSelect, activeStop]);

  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, {
      zoomControl: false, attributionControl: true, scrollWheelZoom: false,
      zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
      minZoom: 13, maxZoom: 18, zoomSnap: 0.5, renderer: L.canvas({ padding: 0.3 }),
      maxBounds: [[39.441, -0.403], [39.497, -0.325]], maxBoundsViscosity: 1,
    });
    mapRef.current = map;
    map.attributionControl.setPrefix(false);
    map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>');
    const bounds = L.latLngBounds(cityStops.map((stop) => stop.position));
    const fit = () => map.fitBounds(bounds, { padding: [70, 55], animate: false });
    fit();
    const abort = new AbortController();
    fetch("/maps/valencia-city.geojson", { signal: abort.signal })
      .then((response) => { if (!response.ok) throw new Error("Map data unavailable"); return response.json() as Promise<FeatureCollection>; })
      .then((data) => {
        if (abort.signal.aborted) return;
        L.geoJSON(data, { interactive: false, style: (feature) => {
          const kind = feature?.properties?.kind;
          if (kind === "park") return { color: "#c5d5b5", fillColor: "#d9e5cb", fillOpacity: 1, weight: 0.5 };
          if (kind === "water") return { color: "#acd0d4", fillColor: "#c0dcde", fillOpacity: 1, weight: 0.5 };
          return { color: kind === "cycle" ? "#bbc9ad" : "#ffffff", opacity: 1, weight: kind === "major" ? 6 : kind === "cycle" ? 1.5 : 2.5 };
        } }).addTo(map);
        L.polyline(cityRouteLine, { color: "#fff", weight: 8, opacity: 0.95, interactive: false }).addTo(map);
        L.polyline(cityRouteLine, { color: "#c95d00", weight: 4, dashArray: "8 7", opacity: 1, interactive: false }).addTo(map);
        const labels: [L.LatLngTuple, string][] = [
          [[39.476, -0.3825], "CIUTAT VELLA"], [[39.466, -0.373], "L’EIXAMPLE"],
          [[39.473, -0.3595], "JARDÍ DEL TÚRIA"], [[39.4558, -0.347], "ARTS I CIÈNCIES"],
        ];
        labels.forEach(([point, name]) => L.marker(point, { interactive: false, keyboard: false, icon: L.divIcon({ className: "route-map-label", html: name, iconSize: [130, 20] }) }).addTo(map));
        const leaders = cityStops.map(() => L.polyline([], { color: "#496353", weight: 1, opacity: 0.65, interactive: false }).addTo(map));
        markers.current = cityStops.map((stop, i) => {
          const marker = L.marker(stop.position, {
            keyboard: true, title: `${i + 1}. ${stops(`${i}.name`)}`,
            icon: L.divIcon({ className: `route-number${i === active.current ? " route-number-active" : ""}`, html: String(i + 1), iconSize: [36, 36], iconAnchor: [18, 18] }),
          }).addTo(map).on("click", () => onSelect.current(i));
          marker.getElement()?.setAttribute("aria-label", `${i + 1}. ${stops(`${i}.name`)}`);
          marker.getElement()?.setAttribute("aria-pressed", String(i === active.current));
          marker.getElement()?.addEventListener("keydown", (event) => {
            if (event.key === " ") { event.preventDefault(); onSelect.current(i); }
          });
          return marker;
        });
        const positionMarkers = () => {
          const size = map.getSize();
          const originals = cityStops.map((stop) => map.latLngToContainerPoint(stop.position));
          const visible = originals.map((point) => point.x >= 0 && point.x <= size.x && point.y >= 0 && point.y <= size.y);
          const points = originals.map((point, i) => map.getZoom() < 16 && visible[i] ? point.add(callouts[i] ?? [0, 0]) : point);
          // Keep overview labels apart; leader lines retain the true geographic locations.
          if (map.getZoom() < 16) {
            for (let pass = 0; pass < 100; pass++) {
              for (let i = 0; i < points.length; i++) {
                if (!visible[i]) continue;
                for (let j = i + 1; j < points.length; j++) {
                  if (!visible[j]) continue;
                  const dx = points[j].x - points[i].x;
                  const dy = points[j].y - points[i].y;
                  const distance = Math.hypot(dx, dy) || 0.1;
                  if (distance >= 44) continue;
                  const push = (44 - distance) / 2 + 0.1;
                  const ux = dx / distance || 1;
                  const uy = dy / distance;
                  points[i] = points[i].subtract([ux * push, uy * push]);
                  points[j] = points[j].add([ux * push, uy * push]);
                }
                points[i].x = Math.max(23, Math.min(size.x - 23, points[i].x));
                points[i].y = Math.max(88, Math.min(size.y - 38, points[i].y));
              }
            }
          }
          markers.current.forEach((marker, i) => {
            const original = L.latLng(cityStops[i].position);
            const shifted = map.containerPointToLatLng(points[i]);
            marker.setLatLng(shifted);
            leaders[i].setLatLngs(map.getZoom() < 16 && visible[i] ? [original, shifted] : []);
          });
        };
        map.on("zoomend moveend", positionMarkers);
        positionMarkers();
        setReady(true);
      }).catch((error) => { if (error.name !== "AbortError") setFailed(true); });
    const resize = new ResizeObserver(() => { map.invalidateSize({ animate: false }); });
    resize.observe(element.current);
    return () => { abort.abort(); resize.disconnect(); markers.current = []; map.remove(); mapRef.current = null; };
  }, [stops]);

  useEffect(() => {
    markers.current.forEach((marker, i) => {
      marker.getElement()?.classList.toggle("route-number-active", i === activeStop);
      marker.getElement()?.setAttribute("aria-pressed", String(i === activeStop));
      marker.setZIndexOffset(i === activeStop ? 1000 : 0);
    });
    // The initial map shows the whole itinerary; selecting a stop reveals its street context.
    if (mapRef.current && ready && lastSelection.current !== activeStop) mapRef.current.setView(cityStops[activeStop].position, 16.5, { animate: false });
    lastSelection.current = activeStop;
  }, [activeStop, ready]);

  return (
    <div className="relative isolate overflow-hidden rounded-[var(--radius-image)] border border-[var(--color-border)]">
      <div ref={element} dir="ltr" className={`${styles.map} h-[420px] w-full sm:h-[540px]`} role="region" aria-label={t("mapLabel")} />
      <div className="absolute start-3 top-3 z-[1000] flex gap-1 rounded-xl border border-[var(--color-border)] bg-white p-1 shadow-sm">
        <button type="button" className="h-11 w-11 rounded-lg text-2xl hover:bg-[var(--color-brand-sand)]" aria-label={t("zoomIn")} onClick={() => mapRef.current?.zoomIn(undefined, { animate: false })}>+</button>
        <button type="button" className="h-11 w-11 rounded-lg text-2xl hover:bg-[var(--color-brand-sand)]" aria-label={t("zoomOut")} onClick={() => mapRef.current?.zoomOut(undefined, { animate: false })}>−</button>
        <button type="button" className="min-h-11 rounded-lg px-3 text-sm font-semibold hover:bg-[var(--color-brand-sand)]" onClick={() => mapRef.current?.fitBounds(L.latLngBounds(cityStops.map((stop) => stop.position)), { padding: [70, 55], animate: false })}>{t("fullRoute")}</button>
      </div>
      {!ready && !failed && <p className="absolute bottom-10 start-4 z-[1000] rounded-lg bg-white px-3 py-2 text-sm" role="status">{t("mapLoading")}</p>}
      {failed && <p className="absolute bottom-10 start-4 end-4 z-[1000] rounded-lg bg-white p-4 text-sm" role="status">{t("mapUnavailable")}</p>}
    </div>
  );
}
