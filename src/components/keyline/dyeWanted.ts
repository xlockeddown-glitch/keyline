import { useEffect } from "react";

// 0.1.193: the print shop is open while at least one PrintShop is mounted; DyeSync then builds every look at once.
let shopsOpen = 0;
const shopSubs = new Set<() => void>();

export const subscribeShop = (f: () => void) => {
  shopSubs.add(f);
  return () => void shopSubs.delete(f);
};
export const shopIsOpen = () => shopsOpen > 0;

/** Call from the print shop: its coat swatches want every look built now. */
export function useDyesWanted(): void {
  useEffect(() => {
    shopsOpen++;
    shopSubs.forEach((f) => f());
    return () => {
      shopsOpen--;
      shopSubs.forEach((f) => f());
    };
  }, []);
}
