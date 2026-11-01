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
      <img
        src={`/sprites/matches/${item}.png`}
        alt=""
        width={size}
        height={Math.round(size * 1.45)}
        draggable={false}
        className={`match-glyph tier-${item} ${className}`}
        style={{ width: "auto", height: Math.round(size * 1.45) }}
      />
    );
  }
  if (item === "coin") {
    return (
      <span className={`coin-well ${className}`} style={{ width: size, height: size }} aria-hidden>
        <img src={itemSrc(item)} alt="" width={size} height={size} draggable={false} />
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

export function QtyChip({ item, n }: { item: ItemId; n: number }) {
  if (!n) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-fg">
      <ItemIcon item={item} size={32} />
      {n > 0 ? `+${n}` : n}
    </span>
  );
}
