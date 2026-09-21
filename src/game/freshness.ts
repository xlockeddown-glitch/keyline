/** Weekly volatile-fact pass. Does not rewrite banks; quarantine on a clear mismatch. */

export type FreshTag = "stable" | "volatile";

export type FreshPlate = {
  id: string;
  q: string;
  answer: string;
  choices?: string[];
  fresh?: FreshTag;
};

const CHECKS: { reason: string; re: RegExp }[] = [
  { reason: "current-mayor", re: /\bcurrent mayor\b|\bsitting mayor\b|\bwho is the mayor of\b/i },
  { reason: "population", re: /\b(?:current )?population of\b|\bhow many people live\b|\bpopulation is\b/i },
  { reason: "champion", re: /\b(?:current|reigning|defending) champion\b/i },
  { reason: "tallest", re: /\btallest (?:building|tower|skyscraper|structure)\b/i },
  { reason: "as-of", re: /\bas of\b/i },
  { reason: "currently", re: /\bcurrently\b|\bcurrent (?:president|prime minister|monarch|king|queen|pope|holder)\b/i },
  { reason: "stale-year", re: /\b(?:2024|2025|2026|2027)\b/ },
];

export function volatileReason(plate: { q: string; answer?: string; fresh?: FreshTag }): string | null {
  if (plate.fresh === "volatile") return "tagged";
  if (plate.fresh === "stable") return null;
  const blob = `${plate.q} ${plate.answer ?? ""}`;
  for (const { reason, re } of CHECKS) {
    if (re.test(blob)) return reason;
  }
  return null;
}

export type VerifyHit = {
  mismatch: boolean;
  source?: string | null;
};

export type FreshRecord = {
  plateId: string;
  fresh: FreshTag;
  quarantined: boolean;
  verifiedAt: string | null;
  reason: string | null;
  source: string | null;
  action: "hold" | "quarantine" | "ok";
};

export const FRESH_LIMIT = 20;

export async function freshnessPass(
  plates: readonly FreshPlate[],
  opts: {
    now?: Date;
    limit?: number;
    verify?: (p: FreshPlate) => Promise<VerifyHit | null>;
  } = {},
): Promise<{ records: FreshRecord[]; quarantined: string[] }> {
  const stamp = (opts.now ?? new Date()).toISOString();
  const cap = opts.limit ?? FRESH_LIMIT;
  const records: FreshRecord[] = [];
  const quarantined: string[] = [];
  let used = 0;
  for (const plate of plates) {
    const reason = volatileReason(plate);
    const rec: FreshRecord = {
      plateId: plate.id,
      fresh: reason ? "volatile" : (plate.fresh ?? "stable"),
      quarantined: false,
      verifiedAt: null,
      reason,
      source: null,
      action: "hold",
    };
    if (reason && opts.verify && used < cap) {
      used += 1;
      const hit = await opts.verify(plate);
      rec.verifiedAt = stamp;
      rec.source = hit?.source ?? null;
      if (hit?.mismatch) {
        rec.quarantined = true;
        rec.action = "quarantine";
        quarantined.push(plate.id);
      } else if (hit) {
        rec.action = "ok";
      }
    }
    if (reason || rec.verifiedAt) records.push(rec);
  }
  return { records, quarantined };
}

const WIKI_UA = "KeylineTriviaRetune/1.0 (weekly job; wikipedia.org/api)";

export async function wikiVerify(plate: FreshPlate, fetchImpl: typeof fetch = fetch): Promise<VerifyHit | null> {
  const q = plate.q.replace(/[…?.]/g, " ").replace(/\s+/g, " ").trim();
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", plate.answer.length > 4 ? plate.answer : q);
  url.searchParams.set("srlimit", "1");
  url.searchParams.set("format", "json");
  const res = await fetchImpl(url, { headers: { "User-Agent": WIKI_UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as { query?: { search?: { title: string }[] } };
  const title = data.query?.search?.[0]?.title;
  if (!title) return null;
  const slug = encodeURIComponent(title.replace(/ /g, "_"));
  const sumRes = await fetchImpl(`https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
  });
  if (!sumRes.ok) return { mismatch: false, source: `https://en.wikipedia.org/wiki/${slug}` };
  const sum = (await sumRes.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
  const text = `${sum.extract ?? ""} ${title}`.toLowerCase();
  const source = sum.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${slug}`;
  const ans = plate.answer.toLowerCase();
  const ansHit = ans.length >= 3 && text.includes(ans);
  const distractor = (plate.choices ?? []).some((c) => c !== plate.answer && c.length >= 4 && text.includes(c.toLowerCase()));
  return { mismatch: Boolean(distractor && !ansHit), source };
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
