import assert from "node:assert/strict";
import { test } from "node:test";
import { PLATE_KEEP, addTally, bumpRoll, emitOnAnswer, emptyAgg, finishPlate, pushPlate, recordPlateEvent } from "./telemetry.ts";

test("finishPlate fills latency and required fields", () => {
  const ev = finishPlate({
    plateId: "p00aabbcc",
    shownAt: 1_000,
    answeredAt: 1_450,
    correct: true,
    rarity: "blue",
    city: "austin",
    difficulty: 2,
    saveId: "save-1",
  });
  assert.ok(ev);
  assert.equal(ev!.plateId, "p00aabbcc");
  assert.equal(ev!.shownAt, 1000);
  assert.equal(ev!.answeredAt, 1450);
  assert.equal(ev!.latencyMs, 450);
  assert.equal(ev!.correct, true);
  assert.equal(ev!.rarity, "blue");
  assert.equal(ev!.city, "austin");
  assert.equal(ev!.difficulty, 2);
  assert.equal(ev!.saveId, "save-1");
});

test("city and difficulty may be null; missing id is dropped", () => {
  const ev = finishPlate({
    plateId: "p1",
    shownAt: 10,
    answeredAt: 8,
    correct: false,
    saveId: "s",
  });
  assert.ok(ev);
  assert.equal(ev!.city, null);
  assert.equal(ev!.difficulty, null);
  assert.equal(ev!.rarity, "white");
  assert.equal(ev!.latencyMs, 0);
  assert.equal(finishPlate({ plateId: "", shownAt: 1, answeredAt: 2, correct: true, saveId: "s" }), null);
  assert.equal(finishPlate({ plateId: "p1", shownAt: 1, answeredAt: 2, correct: true, saveId: "" }), null);
});

test("ring keeps the newest plates only", () => {
  let log: ReturnType<typeof finishPlate>[] = [];
  for (let i = 0; i < PLATE_KEEP + 5; i++) {
    const ev = finishPlate({
      plateId: `p${i}`,
      shownAt: i,
      answeredAt: i + 10,
      correct: i % 2 === 0,
      rarity: "green",
      city: "temple",
      difficulty: 1,
      saveId: "save",
    })!;
    log = pushPlate(log as never, ev);
  }
  assert.equal(log.length, PLATE_KEEP);
  assert.equal(log[0]!.plateId, "p5");
  assert.equal(log[log.length - 1]!.plateId, `p${PLATE_KEEP + 4}`);
});

test("recordPlateEvent appends a finished row and tallies rarity", () => {
  const first = recordPlateEvent([], emptyAgg(), {
    plateId: "pa",
    shownAt: 50,
    answeredAt: 80,
    correct: false,
    rarity: "red",
    city: null,
    difficulty: 3,
    saveId: "walker",
  });
  assert.equal(first.plates.length, 1);
  assert.equal(first.event?.latencyMs, 30);
  assert.equal(first.event?.city, null);
  assert.equal(first.plateAgg.red.shown, 1);
  assert.equal(first.plateAgg.red.correct, 0);
  assert.equal(first.plateAgg.red.latencySum, 30);
  assert.equal(first.plateRoll.pa?.attempts, 1);
  assert.equal(first.plateRoll.pa?.correctCount, 0);
  assert.equal(first.plateRoll.pa?.sumLatencyMs, 30);
  const hit = recordPlateEvent(
    first.plates,
    first.plateAgg,
    {
      plateId: "pb",
      shownAt: 90,
      answeredAt: 110,
      correct: true,
      rarity: "red",
      saveId: "walker",
    },
    first.plateRoll,
  );
  assert.equal(hit.plateAgg.red.shown, 2);
  assert.equal(hit.plateAgg.red.correct, 1);
  assert.equal(hit.plateRoll.pb?.attempts, 1);
  assert.equal(hit.plateRoll.pb?.correctCount, 1);
  const second = recordPlateEvent(first.plates, first.plateAgg, {
    plateId: "",
    shownAt: 90,
    answeredAt: 91,
    correct: true,
    saveId: "walker",
  });
  assert.equal(second.event, null);
  assert.equal(second.plates.length, 1);
});

test("addTally is per-rarity and does not grow keys", () => {
  const ev = finishPlate({
    plateId: "p",
    shownAt: 0,
    answeredAt: 20,
    correct: true,
    rarity: "violet",
    saveId: "s",
  })!;
  const next = addTally(emptyAgg(), ev);
  assert.equal(next.violet.shown, 1);
  assert.equal(next.violet.correct, 1);
  assert.equal(next.white.shown, 0);
});

test("per-plate roll accumulates and drops the oldest when over cap", () => {
  const ev = finishPlate({
    plateId: "keep",
    shownAt: 100,
    answeredAt: 200,
    correct: true,
    rarity: "blue",
    saveId: "s",
  })!;
  let map = bumpRoll({}, ev, 2);
  map = bumpRoll(map, { ...ev, plateId: "mid", answeredAt: 150, correct: false }, 2);
  map = bumpRoll(map, { ...ev, plateId: "new", answeredAt: 300 }, 2);
  assert.equal(Object.keys(map).length, 2);
  assert.equal(map.mid, undefined);
  assert.equal(map.keep?.attempts, 1);
  assert.equal(map.new?.attempts, 1);
  map = bumpRoll(map, { ...ev, plateId: "keep", answeredAt: 400, correct: false }, 2);
  assert.equal(map.keep?.attempts, 2);
  assert.equal(map.keep?.correctCount, 1);
  assert.equal(map.keep?.sumLatencyMs, ev.latencyMs * 2);
});

test("answer emits one event with the locked fields", () => {
  const shownAt = 1_700_000_000_000;
  const answeredAt = shownAt + 3_200;
  const hit = emitOnAnswer({
    saveId: "save-walker",
    cityId: "nola",
    plateId: "pcafe1234",
    shownAt,
    answeredAt,
    correct: true,
    rarity: "amber",
    difficulty: 2,
  });
  const ev = hit.event;
  assert.ok(ev);
  assert.deepEqual(ev, {
    plateId: "pcafe1234",
    shownAt,
    answeredAt,
    latencyMs: 3200,
    correct: true,
    rarity: "amber",
    city: "nola",
    difficulty: 2,
    saveId: "save-walker",
  });
  assert.equal(hit.plates.length, 1);
  assert.equal(hit.plates[0], ev);
  assert.equal(hit.plateAgg.amber.shown, 1);
  assert.equal(hit.plateAgg.amber.correct, 1);
  assert.equal(hit.plateRoll.pcafe1234?.attempts, 1);
  assert.equal(hit.plateRoll.pcafe1234?.correctCount, 1);
  assert.equal(hit.plateRoll.pcafe1234?.sumLatencyMs, 3200);
});

test("a miss still emits; a second answer appends", () => {
  const miss = emitOnAnswer({
    saveId: "s2",
    cityId: "austin",
    plateId: "pmiss",
    shownAt: 10,
    answeredAt: 40,
    correct: false,
    rarity: "white",
    difficulty: 1,
  });
  assert.equal(miss.event?.correct, false);
  assert.equal(miss.plateAgg.white.correct, 0);
  assert.equal(miss.plateRoll.pmiss?.correctCount, 0);
  const next = emitOnAnswer({
    plates: miss.plates,
    plateAgg: miss.plateAgg,
    plateRoll: miss.plateRoll,
    saveId: "s2",
    cityId: "austin",
    plateId: "phit",
    shownAt: 50,
    answeredAt: 70,
    correct: true,
    rarity: "blue",
    difficulty: 1,
  });
  assert.equal(next.plates.length, 2);
  assert.equal(next.plates[1]?.plateId, "phit");
  assert.equal(next.plates[1]?.correct, true);
  assert.equal(next.event?.latencyMs, 20);
});

test("answer with no plate id emits nothing", () => {
  const none = emitOnAnswer({
    saveId: "s3",
    cityId: null,
    plateId: "",
    shownAt: 1,
    answeredAt: 2,
    correct: true,
    rarity: "green",
  });
  assert.equal(none.event, null);
  assert.equal(none.plates.length, 0);
});

