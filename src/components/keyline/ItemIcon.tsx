import { itemSrc, isTier, type ItemId } from "@/game/items";

export function ItemIcon({
  item,
  size = 40,
  className = "",
}: {
  item: ItemId;
  size?: number;
  className?: string;
}) {
  if (isTier(item)) {
    return (
      <span
        className={`match-glyph tier-${item} ${className}`}
        style={{ width: size, height: Math.round(size * 1.25) }}
        aria-hidden
      >
        <i className="match-head" />
        <i className="match-stick" />
      </span>
    );
  }
  return (
    <img
      src={itemSrc(item)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={`item-glyph ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function CostIcons({
  cost,
  have,
}: {
  cost: { brass: number; ink: number; vellum: number; schematic: number };
  have: { brass: number; ink: number; vellum: number; schematics: number };
}) {
  const rows: { id: ItemId; need: number; got: number }[] = [
    { id: "brass", need: cost.brass, got: have.brass },
    { id: "ink", need: cost.ink, got: have.ink },
    { id: "vellum", need: cost.vellum, got: have.vellum },
    { id: "schematic", need: cost.schematic, got: have.schematics },
  ];
  return (
    <ul className="flex flex-wrap gap-2">
      {rows
        .filter((r) => r.need > 0)
        .map((r) => (
          <li
            key={r.id}
            className={`inline-flex items-center gap-1 text-xs tabular-nums ${r.got >= r.need ? "text-fg" : "text-danger"}`}
          >
            <ItemIcon item={r.id} size={20} />
            {r.got}/{r.need}
          </li>
        ))}
    </ul>
  );
}

export function QtyChip({ item, n }: { item: ItemId; n: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-fg">
      <ItemIcon item={item} size={32} />
      {n > 0 ? `+${n}` : n}
    </span>
  );
}
