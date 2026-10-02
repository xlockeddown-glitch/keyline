/**
 * Sprite facing from yaw. Yaw is radians counter-clockwise from north
 * (0 = north, π/2 = west), matching GameMap's movement (north = cos, east = −sin).
 *
 * Walk sheets have four rows: 0 = down (south), 1 = left (west), 2 = right (east),
 * 3 = up (north). Diagonals always show the side profile, so NE/SE both face
 * right and NW/SW both face left — before, NE showed the back and SW the front.
 */
export type WalkRow = 0 | 1 | 2 | 3;
export type Face = "down" | "left" | "right" | "up";

const EPS = 1e-6;

export function walkRow(yaw: number): WalkRow {
  const north = Math.cos(yaw);
  const west = Math.sin(yaw);
  if (Math.abs(west) + EPS >= Math.abs(north)) return west > 0 ? 1 : 2;
  return north > 0 ? 3 : 0;
}

const FACES: Record<WalkRow, Face> = { 0: "down", 1: "left", 2: "right", 3: "up" };

export function faceFromYaw(yaw: number): Face {
  return FACES[walkRow(yaw)];
}

/**
 * Which sheet and cell a scout shows this frame. Walking uses the 4x4 walk sheet. Standing still
 * after walking left or right uses the 2x2 side-idle sheet (row 0 left, row 1 right, two breaths),
 * so the scout keeps facing the way it was going; standing after walking up or down uses the
 * front idle sheet (2x2, four frames). `frame` is the 0–3 animation counter.
 */
export function spriteCell(moving: boolean, row: WalkRow, frame: number): { sheet: "walk" | "idle" | "idle-side"; position: string } {
  const f = ((Math.floor(frame) % 4) + 4) % 4;
  if (moving) return { sheet: "walk", position: `${f * 33.333}% ${row * 33.333}%` };
  if (row === 1 || row === 2) return { sheet: "idle-side", position: `${(f % 2) * 100}% ${(row - 1) * 100}%` };
  return { sheet: "idle", position: `${(f % 2) * 100}% ${Math.floor(f / 2) * 100}%` };
}
