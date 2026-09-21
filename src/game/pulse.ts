/** Daily City Pulse — independent of the crate streak. */
export const PULSE_POINTS = 80;

export function isoDay(at = new Date()) {
  return at.toISOString().slice(0, 10);
}

export function pulseDue(lastDay: string, today: string) {
  return lastDay !== today;
}
