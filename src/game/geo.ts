const M_PER_DEG_LAT = 111_320;

export function metersPerDegLng(lat: number) {
  return M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

export function distM(aLat: number, aLng: number, bLat: number, bLng: number) {
  const dLat = (bLat - aLat) * M_PER_DEG_LAT;
  const dLng = (bLng - aLng) * metersPerDegLng((aLat + bLat) / 2);
  return Math.hypot(dLat, dLng);
}

export function dest(lat: number, lng: number, northM: number, eastM: number) {
  return {
    lat: lat + northM / M_PER_DEG_LAT,
    lng: lng + eastM / metersPerDegLng(lat),
  };
}

/** Bearing from heading yaw (0 = north, +CCW toward west) to a target. */
export function yawToTarget(lat: number, lng: number, yaw: number, tLat: number, tLng: number) {
  const dLat = (tLat - lat) * M_PER_DEG_LAT;
  const dLng = (tLng - lng) * metersPerDegLng(lat);
  const target = Math.atan2(-dLng, dLat);
  let d = target - yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function wrapPi(a: number) {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

export function formatDist(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}
