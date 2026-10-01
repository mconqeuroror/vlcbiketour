export interface CityStop {
  id: string;
  position: [number, number];
  image: string;
  photoId: string;
}

// Landmark coordinates: Wikipedia/Wikimedia; meeting point: Casa Fenicia's own map.
// Turia marks the section reached from Serranos, rather than the park's western end.
export const cityStops: CityStop[] = [
  { id: "cathedral", position: [39.475611, -0.375139], image: "/images/stops/01-cathedral.webp", photoId: "01-cathedral" },
  { id: "almoina", position: [39.476258, -0.374156], image: "/images/stops/02-almoina.webp", photoId: "02-almoina" },
  { id: "plaza-virgen", position: [39.476364, -0.375292], image: "/images/stops/03-plaza-virgen.webp", photoId: "03-plaza-virgen" },
  { id: "serranos", position: [39.4793, -0.375933], image: "/images/stops/04-serranos.webp", photoId: "04-serranos" },
  { id: "turia", position: [39.4786, -0.37375], image: "/images/stops/05-turia.webp", photoId: "05-turia" },
  { id: "exposicion", position: [39.4731, -0.365981], image: "/images/stops/06-exposicion.webp", photoId: "06-exposicion" },
  { id: "flores", position: [39.471175, -0.364156], image: "/images/stops/07-flores.webp", photoId: "07-flores" },
  { id: "palau-musica", position: [39.466111, -0.360278], image: "/images/stops/08-palau-musica.webp", photoId: "08-palau-musica" },
  { id: "gulliver", position: [39.4625, -0.359667], image: "/images/stops/09-gulliver.webp", photoId: "09-gulliver" },
  { id: "arts-sciences", position: [39.454528, -0.350364], image: "/images/tour-city-highlights--arts-and-sciences.webp", photoId: "preserved-arts-sciences" },
  { id: "ceramics", position: [39.472639, -0.374722], image: "/images/stops/11-ceramics.webp", photoId: "11-ceramics" },
  { id: "central-market", position: [39.473503, -0.378942], image: "/images/stops/12-central-market.webp", photoId: "12-central-market" },
  { id: "lonja", position: [39.474444, -0.378333], image: "/images/stops/13-lonja.webp", photoId: "13-lonja" },
  { id: "casa-fenicia", position: [39.475103, -0.376604], image: "/images/stops/14-corretgeria.webp", photoId: "14-corretgeria" },
];

// This connects the approved stop order. It is an overview, not a street-level riding track.
export const cityRouteLine: [number, number][] = [
  cityStops[13].position, ...cityStops.slice(0, 5).map((stop) => stop.position),
  [39.47765, -0.3715], [39.4764, -0.3693], [39.4745, -0.3673],
  cityStops[5].position, cityStops[6].position, [39.4691, -0.3616],
  cityStops[7].position, cityStops[8].position, [39.45945, -0.358],
  [39.45725, -0.3549], cityStops[9].position,
  [39.4587, -0.3559], [39.4626, -0.3616], [39.4682, -0.3678],
  ...cityStops.slice(10).map((stop) => stop.position),
];

export function tourIdFromHash(hash: string): string | null {
  return ({ "#shared": "valencia-group-tour", "#private-city": "private-city", "#private-architecture": "private-architecture" } as Record<string, string>)[hash] ?? null;
}
export function tourHash(id: string): string {
  return id === "valencia-group-tour" ? "#shared" : `#${id}`;
}
