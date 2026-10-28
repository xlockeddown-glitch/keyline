/**
 * 0.1.57: in an open car (the Bel Air convertible) the worn coat rides along: the scout's own sprite (coat and dyes
 * included) shows head and shoulders above the door line. Closed cars keep hiding the scout. The cell is a still
 * side idle facing the drive (or the front idle / back walk frame), so the sheet already handles mirroring.
 */
import { V2_COLS, V2_ROWS, V2_SCOUTS } from "./coatLayer.ts";
import type { CarId } from "./cars.ts";
import type { Face } from "./facing.ts";

/** Cars with an open cabin that show their driver. */
export const OPEN_CARS: ReadonlySet<CarId> = new Set<CarId>(["belair57"]);

/** Views the driver is drawn in (the car art keeps its own head-height in the others). */
export const DRIVER_FACES: ReadonlySet<Face> = new Set<Face>(["left", "right", "down", "up"]);

export function driverShows(car: CarId | null | undefined, scout: string, face: Face): boolean {
  return Boolean(car && OPEN_CARS.has(car) && V2_SCOUTS.has(scout) && DRIVER_FACES.has(face));
}

/** The v2 sheet cell the seated driver shows: side idle frame 0 (left cols 0-3, right cols 4-7), front idle, back walk. */
export function driverCell(face: Face): { col: number; row: number; position: string } {
  const [col, row] = face === "left" ? [0, 5] : face === "right" ? [4, 5] : face === "up" ? [0, 3] : [0, 4];
  const x = (col / (V2_COLS - 1)) * 100;
  const y = (row / (V2_ROWS - 1)) * 100;
  return { col, row, position: `${+x.toFixed(4)}% ${+y.toFixed(4)}%` };
}
