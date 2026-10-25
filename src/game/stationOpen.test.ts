import assert from "node:assert/strict";
import { test } from "node:test";
import { CITY_LIST, isService } from "./data.ts";
import { fareDeskNote, isFareDesk } from "./ticket.ts";

const desks = CITY_LIST.flatMap((c) => c.pois.filter((p) => isFareDesk(p)).map((p) => ({ city: c.id, p })));

test("0.1.41: every city has a train stop and every one is a desk, never a lamp", () => {
  for (const c of CITY_LIST) assert.ok(c.pois.some((p) => isFareDesk(p)), `${c.id} has no fare desk`);
  for (const { city, p } of desks) {
    for (const fares of [0, 1, 2]) { // cityVaults
      for (const seated of [false, true]) {
        const note = fareDeskNote(p, fares, seated);
        assert.ok(note, `${city}/${p.id} fell through to the lamp check (vaults ${fares}, seated ${seated})`);
        assert.doesNotMatch(note!, /match|wick|spark/i, `${city}/${p.id}`);
      }
    }
  }
  for (const c of CITY_LIST) for (const p of c.pois.filter((q) => q.kind === "station")) assert.ok(isService(p));
});

test("0.1.41: lamps still take the lamp path", () => {
  const lamp = CITY_LIST.flatMap((c) => c.pois).find((p) => !isService(p) && !p.printShop)!;
  assert.equal(fareDeskNote(lamp, 0), null);
});
