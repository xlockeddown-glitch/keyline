---
name: trivia-qa
description: >
  Audit KEYLINE trivia plates for validity and factual accuracy whenever
  questions are added or changed. Structural + math checks are automatic
  (`scripts/trivia-audit.mjs`, watches the banks). Lookup plates must be
  confirmed against reputable sources (Wikipedia, Britannica, official
  league/government/museum pages, textbooks). Triggers on "trivia",
  "questions", "vault", "quiz", "bank", "math problems", "categories".
metadata:
  short-description: "Trivia plate auditor — validity, math, Wikipedia/encyclopedia facts"
user-invocable: true
---

# Trivia QA

Run this **every time** you add or edit plates in `src/game/banks/` or
`src/game/trivia.ts`. The watcher (`node scripts/trivia-audit.mjs --watch`)
is started from `startup.sh` and re-audits on save. You still confirm facts.

## Automatic (do not skip)

```
node scripts/trivia-audit.mjs --facts
```

Exit 0 before you tell the player the bank is good. Report lives at
`.grok/trivia-audit-report.json`. Cache of confirmed hashes:
`.grok/trivia-audit-cache.json`.

The script already:

1. **Validity** — four unique choices, answer on the plate, difficulty 1–3,
   no empty prompt, no two plates with the same prompt and different answers,
   no answer sitting in the prompt, no city-in-the-team-name giveaways.
2. **Craft** — language (typos, "Lake Loch", doubled words), capitalization
   of prompts, punctuation (`?` / `…`, no double spaces), structure
   (unmatched parens, duplicate choices once punctuation is stripped), and
   contextual overlap of distinctive answer words.
3. **Semantics** — partial-truth distractors (Europe sitting next to
   Asia / Europe), reverse leaks (the answer named inside a wrong choice),
   alias pairs (Holland and the Netherlands), WH-type mismatch (city vs year),
   generator filler ("as this name"), soccer vs football on a FIFA plate,
   father/son gotchas on white vaults.
4. **Math** — computes arithmetic / algebra / named-value plates.
5. **Facts (changed plates)** — Wikipedia REST summary (Wikimedia). A miss is
   a warning; a distractor on the page and not the answer is an error.

## Agent pass (reputable sources)

For every **new or edited lookup plate** (capitals, dates, who/what/where,
sports homes, science names):

1. Confirm the answer against **at least one**:
   - Wikipedia / Wikidata (already in the script)
   - Encyclopædia Britannica
   - Official body: FIFA, NFL, NASA, USGS, US Census, UK Parliament, a
     city's own site, a museum's own site
   - A standard textbook fact (SI units, periodic table)
2. If Wikipedia and the official page disagree, **official wins**. Fix the plate.
3. LOCAL plates must match the city or its state — no Vermont on an Austin door.
4. Math on white vaults stays grade-school; red/violet may be algebra.

Do not add a plate you have not confirmed. Do not leave a `fact` error in
the audit report.

## After edits

Re-run the audit. If it flags math, fix the number. If it flags a fact,
open the cited Wikipedia URL (and a second source) and correct the plate
or the distractors.
