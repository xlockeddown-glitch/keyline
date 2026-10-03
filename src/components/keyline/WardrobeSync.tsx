import { useEffect, useRef } from "react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { mergeWardrobe, sameWardrobe, type Wardrobe } from "@/game/cosmetics";
import { fetchWardrobe, syncWardrobe } from "@/game/wardrobeApi";
import { useGame } from "@/game/store";

/** Lantern skins re-case every lamp on the page (street, Run, Stack, vault hero, title lamp) from one root attribute. */
function applyLantern(id: string | null) {
  if (typeof document === "undefined") return;
  if (id) document.documentElement.dataset.lantern = id;
  else delete document.documentElement.dataset.lantern;
}

/**
 * 0.0.45 print shop wardrobe: the lantern-skin root attribute for everyone, and for a signed-in walker a
 * server copy — pulled and merged on sign-in, pushed (debounced) after every purchase, instalment or equip.
 * Guests keep the wardrobe in the local save only.
 */
export function WardrobeSync() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user && !user.isDevFallback ? user.id : null;
  const synced = useRef<Wardrobe | null>(null);

  useEffect(() => {
    applyLantern(useGame.getState().wardrobe.lantern);
    return useGame.subscribe((s, p) => {
      if (s.wardrobe.lantern !== p.wardrobe.lantern) applyLantern(s.wardrobe.lantern);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      synced.current = null;
      return;
    }
    let live = true;
    let timer: number | null = null;
    const push = async () => {
      const local = useGame.getState().wardrobe;
      try {
        const server = await syncWardrobe({ data: local });
        if (!live) return;
        // Anything bought or worn while the request was in flight merges back in rather than being overwritten.
        const merged = mergeWardrobe(server, useGame.getState().wardrobe);
        synced.current = server;
        useGame.getState().adoptWardrobe(merged);
        if (!sameWardrobe(merged, server)) schedule();
      } catch {
        /* offline or signed out mid-flight: the local save still has it; the next change retries */
      }
    };
    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        timer = null;
        void push();
      }, 700);
    };
    void (async () => {
      try {
        const server = await fetchWardrobe();
        if (!live) return;
        synced.current = server;
        const merged = mergeWardrobe(server, useGame.getState().wardrobe);
        useGame.getState().adoptWardrobe(merged);
        if (!sameWardrobe(merged, server)) void push();
      } catch {
        /* no session server-side yet — stay local */
      }
    })();
    const unsub = useGame.subscribe((s, p) => {
      if (s.wardrobe === p.wardrobe) return;
      if (synced.current && sameWardrobe(s.wardrobe, synced.current)) return;
      schedule();
    });
    return () => {
      live = false;
      unsub();
      if (timer) window.clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
