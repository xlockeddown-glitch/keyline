import { faceFromYaw, type Face } from "./facing.ts";

/** 0.1.68: marker scale for a zoom: 1 at street zoom 17, gentler than true scale, floored so pins stay tappable. */
export function worldScale(zoom: number): number {
  return Math.min(1.3, Math.max(0.8, 2 ** ((zoom - 17) / 2)));
}

/** 0.1.68: the small clockwise tilt (degrees, ±45) that turns a 4-way car sprite to the road's exact bearing. */
export function roadTilt(yaw: number): number {
  const base: Record<Face, number> = { up: 0, right: 90, down: 180, left: 270 };
  const heading = (-yaw * 180) / Math.PI;
  const d = (((heading - base[faceFromYaw(yaw)]) % 360) + 540) % 360 - 180;
  return Math.round(Math.max(-45, Math.min(45, d)));
}
