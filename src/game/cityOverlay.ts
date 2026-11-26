/**
 * 0.1.180: the city's painted overlay (water, parks, landmarks; streets left clear), for cities whose manifest entry
 * pins one (Philly). Fetched and verified like the street pack; it never blocks play and never raises a notice.
 */
import { fetchVerified, type PackPin } from "./packFetch.ts";
import { cityEntry, type CityOverlay } from "./streets.ts";

export const OVERLAY_CLASS = "city-overlay";
export const OVERLAY_OPACITY = 0.9;

export function overlayPin(o: CityOverlay): PackPin {
  return { url: o.url, sha256: o.sha256, bytes: o.bytes, remote: /^https?:\/\//.test(o.url) };
}

/** Leaflet's [[south-west], [north-east]]: the image was rendered in Web Mercator over exactly this box. */
export function overlayBounds(o: CityOverlay): [[number, number], [number, number]] {
  return [
    [o.bounds.sw[0], o.bounds.sw[1]],
    [o.bounds.ne[0], o.bounds.ne[1]],
  ];
}

type OverlayLayer = { addTo: (map: never) => unknown; remove: () => unknown };
type LeafletLike = {
  imageOverlay: (url: string, bounds: [[number, number], [number, number]], options: Record<string, unknown>) => OverlayLayer;
};

/**
 * Put the city's overlay on the map (overlayPane: above the tiles, below markers and sprites; z-index -1 keeps it
 * under the route lines in that pane). Resolves to its remover, or null when the city has none, the bytes fail the
 * pin, or the map went away meanwhile (`live`).
 */
export async function mountCityOverlay(L: LeafletLike, map: unknown, cityId: string, live: () => boolean = () => true): Promise<(() => void) | null> {
  const o = (await cityEntry(cityId))?.overlay;
  if (!o || !live()) return null;
  const bytes = await fetchVerified(overlayPin(o));
  if (!bytes || !live()) return null;
  const blobUrl = URL.createObjectURL(new Blob([bytes as unknown as BlobPart], { type: "image/webp" }));
  const layer = L.imageOverlay(blobUrl, overlayBounds(o), { interactive: false, className: OVERLAY_CLASS, opacity: OVERLAY_OPACITY, zIndex: -1 });
  layer.addTo(map as never);
  return () => {
    layer.remove();
    URL.revokeObjectURL(blobUrl);
  };
}
