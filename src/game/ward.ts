export type Ward = {
  south: number;
  west: number;
  north: number;
  east: number;
};

const PAD_M = 420;

/** Playable box around vaults, spawn, and blanks, plus a walkable margin. */
export function wardFrom(pts: { lat: number; lng: number }[], padM = PAD_M): Ward {
  if (!pts.length) return { south: 0, west: 0, north: 0, east: 0 };
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const p of pts) {
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
    west = Math.min(west, p.lng);
    east = Math.max(east, p.lng);
  }
  const mid = (south + north) / 2;
  const padLat = padM / 111_320;
  const padLng = padM / (111_320 * Math.max(0.2, Math.cos((mid * Math.PI) / 180)));
  return {
    south: south - padLat,
    north: north + padLat,
    west: west - padLng,
    east: east + padLng,
  };
}

export function inWard(w: Ward, lat: number, lng: number, slack = 0): boolean {
  return lat >= w.south - slack && lat <= w.north + slack && lng >= w.west - slack && lng <= w.east + slack;
}

export function clampWard(w: Ward, lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.min(w.north, Math.max(w.south, lat)),
    lng: Math.min(w.east, Math.max(w.west, lng)),
  };
}

export function wardRing(w: Ward): [number, number][] {
  return [
    [w.south, w.west],
    [w.south, w.east],
    [w.north, w.east],
    [w.north, w.west],
  ];
}
