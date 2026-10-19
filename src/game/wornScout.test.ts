// 0.1.6: the worn scout on the account (migration 0018 + upsert), cross-device, and the local fallback.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { WORN_SELECT, WORN_UPSERT, pickWorn, wornFromRow } from "./wornScoutSql.ts";
import { adoptScout, savedScout } from "./scoutMemory.ts";

const mig = readFileSync(new URL("../../migrations/0018_worn_scouts.sql", import.meta.url), "utf8");

test("cross-device: device A equips the gifted Corgi, device B syncs and shows the Corgi", async () => {
  const db = new PGlite();
  await db.exec(mig);
  await db.exec(mig); // idempotent, additive
  const beth = "b4kKJFQyhu9Muu04I70TirgSafJyY64S";
  const read = async (u: string) => wornFromRow((await db.query<{ scout: string; worn_at: number }>(WORN_SELECT, [u])).rows[0]);

  // Device A (phone) puts on the Corgi at t=2000.
  await db.query(WORN_UPSERT, [beth, "corgi", 2000]);
  // Device B (tablet home-screen app) still has the Raccoon on locally; the owned list from the wallet sync has the Corgi.
  const tabletLocal = { scout: "raccoon", scouts: ["raccoon", "corgi"] };
  const server = await read(beth);
  assert.deepEqual(server, { scout: "corgi", at: 2000 });
  assert.equal(pickWorn(tabletLocal, server), "corgi", "the account's scout wins on sign-in");

  // Idempotent: the same equip replayed, and a late write from a slower device with an older stamp, change nothing.
  await db.query(WORN_UPSERT, [beth, "corgi", 2000]);
  await db.query(WORN_UPSERT, [beth, "raccoon", 1500]);
  assert.deepEqual(await read(beth), { scout: "corgi", at: 2000 });
  // A newer equip does win.
  await db.query(WORN_UPSERT, [beth, "owl", 3000]);
  assert.equal((await read(beth))!.scout, "owl");
  // Other walkers untouched / no row.
  assert.equal(await read("someone-else"), null);
  await db.close();
});

test("pickWorn: keeps local when there's no row, the same scout, or a scout this device doesn't own yet", () => {
  const local = { scout: "corgi", scouts: ["raccoon", "corgi"] };
  assert.equal(pickWorn(local, null), null);
  assert.equal(pickWorn(local, { scout: "corgi", at: 1 }), null);
  assert.equal(pickWorn(local, { scout: "fox", at: 1 }), null, "not owned here: never put on a scout the device lacks");
  assert.equal(pickWorn({ ...local, scouts: [...local.scouts, "fox"] }, { scout: "fox", at: 1 }), "fox", "once owned lands, it applies");
  assert.equal(wornFromRow(undefined), null);
  assert.equal(wornFromRow({ scout: "" }), null);
});

test("fallback: without migration 0018 the read fails (the API answers null) and the local save stays in charge", async () => {
  const db = new PGlite();
  await assert.rejects(db.query(WORN_SELECT, ["u"]));
  await assert.rejects(db.query(WORN_UPSERT, ["u", "corgi", 1]));
  await db.close();
  // Local-only path still holds: a tab's equip reaches the other tab through the save (scoutMemory).
  const p = adoptScout({ scout: "raccoon", scouts: ["raccoon"] }, savedScout(JSON.stringify({ version: 2, scout: "corgi", scouts: ["raccoon", "corgi"] }), () => true)!);
  assert.equal(p?.scout, "corgi");
});
