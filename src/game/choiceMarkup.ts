/**
 * 0.0.52: one place that decides how a trivia card's answer buttons look before the answer is in.
 *
 * It never sees the answer: every choice gets the same class and attributes, only its text and letter differ, and
 * the React key is the card id + slot so each new card mounts fresh buttons (no :hover/:active carried over from
 * the last tap on iOS). choiceMarkup.test.ts keeps it that way, and checks VaultModal renders through it.
 */
export const CHOICE_LETTERS = ["A", "B", "C", "D"] as const;

export type ChoiceButton = {
  key: string;
  className: "plate-choice";
  letter: string;
  text: string;
};

export function choiceButtons(cardId: string, choices: readonly string[]): ChoiceButton[] {
  return choices.map((text, i) => ({
    key: `${cardId}:${i}`,
    className: "plate-choice",
    letter: CHOICE_LETTERS[i] ?? String(i + 1),
    text,
  }));
}

/** Drop whatever focus survived the last tap (the field card, the previous card's choice) when a card opens. */
export function dropStaleFocus(doc: { activeElement: unknown } | null | undefined) {
  const el = doc?.activeElement as { blur?: () => void; tagName?: string } | null | undefined;
  if (el && el.tagName === "BUTTON" && typeof el.blur === "function") el.blur();
}
