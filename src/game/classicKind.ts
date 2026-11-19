/** Explicit allow-list. Undefined is the legacy classic four-choice kind only. */
export function isClassic(card: { kind?: string }): boolean {
  return ["classic"].includes(card.kind ?? "classic");
}
