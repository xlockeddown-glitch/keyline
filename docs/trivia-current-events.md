# Trivia current-events batch — how to repeat it

1. **Branch**: `git worktree add -b wip/trivia-current-N /workspace/kl-current-N origin/main`. Never reuse another job's worktree (check `git worktree list` and `git status` first).
2. **Check what already exists**: `rg -o 'q\("[^"]*20YY[^"]*"' src/game/banks` — earlier weekly batches (`weekly_*.ts`, `plus_*.ts`) already cover many awards. Don't repeat a fact even with new wording.
3. **Research** the last 1–3 months per category (sports, political, food, arts, science, history, nature, games, celebrity, music, books, local). Good recurring hooks: Nobels (early Oct), Emmys/VMAs (Sept), US Open, MLB postseason, Booker/NBA shortlists, Turner Prize, MacArthur, Fat Bear Week, Half Moon Bay pumpkin, Michelin, Nintendo Direct/Gamescom/TGS, city transit openings, archaeology finds, round-number anniversaries. Skip anything still undecided (finals in progress, prizes not yet announced).
4. **Verify** each fact against a primary or major outlet (official site, AP/Reuters/BBC, the organizer's press release). Read the page, not only the search summary. Record every source in `docs/trivia-current-YYYYMMDD-sources.md`.
5. **Write cards** in `src/game/banks/current_YYYYMMDD.ts`, one `CUR_<CAT>_YYYYMMDD` export per category:
   - anchor in time in the prompt ("In Oct 2026…", "At the 2026 Emmys…", "As of Oct 2026…"), so the card stays true;
   - near-miss distractors, similar length (lint flags giveaways), no answer in the prompt, short context for acronyms;
   - tier split close to the category's existing ratio (measure with `everyCardCat()` in a scratch script);
   - math: only if the deck is under `mathCap.maxDeckShare` in `scripts/trivia-quotas.json`; otherwise skip.
6. **Wire** each export into `GENERAL` in `src/game/trivia.ts` with an outer `mergeCat(…, CUR_<CAT>_YYYYMMDD)`.
7. **Bump** `package.json` and `src/version.ts` (APP_VERSION, PUBLISH_STAMP, a changelog comment) to the version you were given.
8. **Gate** (node 22: `PATH=/workspace/node22/bin:$PATH`): `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run trivia:lint`, `npm run trivia:audit` (rerun on its own if Wikipedia rate-limits), `npm run trivia:quotas`, `npm run trivia:balance`, `npm run trivia:repeats`, then `node --experimental-strip-types scripts/qa-no-answers.mjs`.
9. **Screenshots**: dev server on a free port, Playwright at 390×844, set `openVault` on a POI and call `pickCategory(cat)` via the store (see the Books/current batches), then screenshot to `/workspace/screenshots/current-*.png`.
10. **Push the branch only**. No main, no publish.
