import { useEffect, useState } from "react";
import { Gift as GiftIcon, X } from "lucide-react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { SCOUTS } from "@/game/data";
import { useGame } from "@/game/store";
import { claimGiftNote, fetchGifts } from "@/game/giftApi";
import { giftLine, planGift, type Gift } from "@/game/gifts";
import type { ScoutId } from "@/game/types";

type Note = { gift: Gift; scout: ScoutId; alreadyOwned: boolean };

const knownScout = (id: string): id is ScoutId => id in SCOUTS;

/**
 * 0.0.54 gifts, street side: for a signed-in walker, ask the server for gifts that are theirs when the game
 * loads. Each one's scout lands in the save (free; again on any new device), and a note the server hasn't seen
 * claimed shows once in the friend-ticket sheet style, with Wear it now / Close. Closing either way marks it
 * seen in the save and on the server, so it never shows again here or on another device.
 */
export function GiftNote() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const [note, setNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!userId) return;
    let live = true;
    void (async () => {
      let gifts: Gift[];
      try {
        gifts = await fetchGifts();
      } catch {
        return; // offline / no session server-side yet: try again next load
      }
      if (!live) return;
      let first: Note | null = null;
      for (const gift of gifts) {
        const st = useGame.getState();
        const plan = planGift(gift, st, knownScout);
        if (!knownScout(gift.scout)) continue;
        if (plan.grant) st.grantGiftScout(gift.scout);
        if (plan.show && !first) first = { gift, scout: gift.scout, alreadyOwned: plan.alreadyOwned };
        else if (!plan.show && gift.claimed) st.markGiftSeen(gift.id);
      }
      if (first) setNote(first);
    })();
    return () => {
      live = false;
    };
  }, [userId]);

  if (!note) return null;
  const scout = SCOUTS[note.scout];
  const done = (wear: boolean) => {
    const st = useGame.getState();
    st.markGiftSeen(note.gift.id);
    if (wear) st.wearScout(note.scout);
    setNote(null);
    void claimGiftNote({ data: { id: note.gift.id } }).catch(() => {
      /* the save already has it seen; another device may show it once more */
    });
  };

  // No tap-outside close: the note shows once, so only the buttons (or ×) put it away.
  return (
    <div className="ft-veil gift-veil">
      <div
        className="plate ft-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gift-title"
        data-testid="gift-note"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">
              <GiftIcon className="mr-1 inline size-3.5 align-[-2px]" strokeWidth={1.75} aria-hidden />A gift for you
            </p>
            <h2 id="gift-title" className="font-display mt-1 text-2xl leading-tight text-balance">
              {scout.name}
            </h2>
          </div>
          <button type="button" className="ft-close" aria-label="Close" onClick={() => done(false)}>
            <X className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        <div className="gift-art" aria-hidden>
          <img src={scout.icon} alt="" width={96} height={96} />
        </div>
        <p className="ft-q" data-testid="gift-message">
          {note.gift.message}
        </p>
        <p className="mt-3 text-sm text-pretty text-fg-muted" data-testid="gift-line">
          {giftLine(scout.name, note.alreadyOwned)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className="btn btn-primary w-full" data-testid="gift-wear" onClick={() => done(true)}>
            Wear it now
          </button>
          <button type="button" className="btn btn-ghost w-full" data-testid="gift-close" onClick={() => done(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
