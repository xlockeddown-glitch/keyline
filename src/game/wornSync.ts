/**
 * 0.1.106: worn picks that follow the account — city print on the coat, cloth, the car you drive (or the cab), and
 * the market light colour. The server keeps worn:<slot>:<ms> rows (latest wins) and checks ownership.
 */
export type WearSlot = "print" | "cloth" | "car" | "light";
export const WEAR_SLOTS: WearSlot[] = ["print", "cloth", "car", "light"];

/** One device's picks. car: a car id, "cab" (the city cab), or null (the best car owned). */
export type WornPicks = Record<WearSlot, string | null>;
/** The account's picks; a missing slot means no device has chosen one yet. */
export type AccountWorn = Partial<Record<WearSlot, string | null>>;

/** What a device wears when nobody chose anything. A pick equal to this is not worth backfilling. */
export const WORN_DEFAULT: WornPicks = { print: null, cloth: null, car: null, light: "amber" };

export function carPick(carOn: string | null, carCab: boolean): string | null {
  return carCab ? "cab" : carOn;
}

export type WornPlan = {
  /** Slots the account has no pick for and this device does: offered once (the server checks ownership). */
  backfill: { slot: WearSlot; id: string | null }[];
  /** The account's picks this device should take on. */
  adopt: AccountWorn;
};

/** The account's picks win; a slot the account never set keeps this device's pick and offers it. */
export function planWornSync(device: WornPicks, account: AccountWorn): WornPlan {
  const backfill: WornPlan["backfill"] = [];
  const adopt: AccountWorn = {};
  for (const slot of WEAR_SLOTS) {
    if (slot in account) {
      if (account[slot] !== device[slot]) adopt[slot] = account[slot] ?? null;
    } else if (device[slot] !== WORN_DEFAULT[slot]) backfill.push({ slot, id: device[slot] });
  }
  return { backfill, adopt };
}
