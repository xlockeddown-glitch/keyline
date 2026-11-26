/**
 * 0.1.183 Radio hop (CARD-184): pure flavor. After 2,000 m of accepted drive metres (seated in a cab or an owned
 * car, never on foot) in one city on that city's local calendar day, the server unlocks one radio hop for that city
 * that day and the device ducks the city music once under a short sting. No coin, no keys, no mint.
 * Pure rules here; the server write is walletApply.sundayPing and the table is migrations/0020_radio_hop.sql.
 *
 *  - The metres are the ones Sunday Drive already accepted for the same ping (same leg rules, same server clock),
 *    but the counter, the threshold and the table are Radio hop's own.
 *  - The device only labels a ping with the city it was driven in. It never sends a total or an "unlocked" flag.
 *  - The day is the city's own (cityDay, the same clock as same-lamp rest). Leftover metres are dropped when it turns.
 *  - The unlock is one zero-delta ledger row `radio:<city>:<cityDay>`, so a reload or a second device never replays it.
 */

/** Drive metres in one city on one city day that unlock the hop. Whole metres, unlocked at >= this. */
export const RADIO_HOP_M = 2000;

/** The ledger key of a city's hop for one of its local days. One row, so it is once per city per city day. */
export const radioKey = (city: string, day: string) => `radio:${city}:${day}`;

/** What the server sends on the one ping that unlocked the hop, and on no other. */
export type RadioHop = { city: string; day: string; fresh: true };

/** True once the counter has reached the threshold. */
export const radioUnlocked = (meters: number) => Math.floor(Number(meters) || 0) >= RADIO_HOP_M;

/** The Field Guide's line. */
export const RADIO_HOP_GUIDE = "Radio hop: drive 2 km in a city and the radio gives you a little hop, once per city per day.";
