import { useEffect } from "react";

let open = 0;

/**
 * 0.0.57: a bottom sheet (Satchel, Journal, Outfitter, Timetable) is up. Phones hide the map's +/- zoom while any
 * sheet is open — the Leaflet control sits above the overlay and covered the sheet's top-left corner (the
 * 0.0.52 fix only covered the lamp card). Counted, so two stacked sheets don't drop the class early.
 */
export function useSheetOpen(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    open += 1;
    document.documentElement.classList.add("sheet-open");
    return () => {
      open = Math.max(0, open - 1);
      if (!open) document.documentElement.classList.remove("sheet-open");
    };
  }, [isOpen]);
}
