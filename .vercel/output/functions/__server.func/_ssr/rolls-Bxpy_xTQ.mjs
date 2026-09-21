import { n as createMiddleware, r as createServerFn } from "./ssr.mjs";
import { Mt as object, wt as _enum } from "../_libs/@better-auth/core--chunk.mjs";
import { r as getSql } from "./db-DWTpa4m4.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rolls-Bxpy_xTQ.js
/**
* Auth middleware for server functions — the standard way to get the caller's
* verified user id. When deployed the session cookie is same-origin and rides
* along automatically. In the live preview the client also forwards the bearer
* token (partitioned cookies) via the `.client` hook below — call sites do not
* thread it themselves.
*
*   import { createServerFn } from "@tanstack/react-start";
*   import { getSql } from "@/lib/db";
*   import { authMiddleware } from "@/lib/auth/middleware";
*
*   export const listTodos = createServerFn({ method: "GET" })
*     .middleware([authMiddleware])
*     .handler(async ({ context }) => {
*       const sql = await getSql();
*       return sql`select * from todos where user_id = ${context.userId}`;
*     });
*
* Signed out with auth on (live preview included) -> throws `UnauthorizedError`
* (see `verify.server.ts`). With auth disabled (`VITE_AUTH_ENABLED=false`, the
* shipped default) it resolves the shared dev user — but throws instead when a
* `DATABASE_URL` is also set, so an app without sign-in must not use this at
* all. On the auth-on path, use it on every server function that touches
* per-user data and scope every query by `context.userId`.
*/
var authMiddleware = createMiddleware({ type: "function" }).client(async ({ next }) => {
	const { getBearerToken } = await import("./client-DkwNByA6.mjs").then((n) => n.n);
	return next({ sendContext: { bearerToken: getBearerToken() ?? void 0 } });
}).server(async ({ next, context }) => {
	const { assertSameSiteRequest } = await import("./isolation.server-ZQG4KQcM.mjs");
	const { requireUserId } = await import("./verify.server-Ddbo23rE.mjs");
	assertSameSiteRequest();
	return next({ context: { userId: await requireUserId(context.bearerToken) } });
});
var ROLL_TIERS = [
	"white",
	"blue",
	"green",
	"amber",
	"red",
	"violet"
];
var TierSchema = _enum(ROLL_TIERS);
function emptyBoard() {
	return { byTier: {
		white: [],
		blue: [],
		green: [],
		amber: [],
		red: [],
		violet: []
	} };
}
function emptyMine() {
	return { byTier: {
		white: {
			correct: 0,
			rank: null
		},
		blue: {
			correct: 0,
			rank: null
		},
		green: {
			correct: 0,
			rank: null
		},
		amber: {
			correct: 0,
			rank: null
		},
		red: {
			correct: 0,
			rank: null
		},
		violet: {
			correct: 0,
			rank: null
		}
	} };
}
function publicName(name) {
	return ((name ?? "").trim() || "Walker").replace(/[\u0000-\u001f]/g, "").slice(0, 32).trim() || "Walker";
}
/** Public ranked read — guests may view. Writes stay behind authMiddleware. */
var fetchBoard_createServerFn_handler = createServerRpc({
	id: "f21bf057ed8298116184cc7e7c5c3f4d0c7038ac0ae16df8688d4b75b32c3336",
	name: "fetchBoard",
	filename: "src/game/rolls.ts"
}, (opts) => fetchBoard.__executeServer(opts));
var fetchBoard = createServerFn({ method: "GET" }).handler(fetchBoard_createServerFn_handler, async () => {
	try {
		const rows = await (await getSql())`
    with ranked as (
      select
        user_id,
        display_name,
        tier,
        correct,
        row_number() over (
          partition by tier
          order by correct desc, updated_at asc, user_id asc
        ) as rank
      from vault_clears
      where correct > 0
    )
    select user_id, display_name, tier, correct, rank
    from ranked
    where rank <= 25
    order by tier, rank
  `;
		const board = emptyBoard();
		for (const row of rows) {
			if (!ROLL_TIERS.includes(row.tier)) continue;
			board.byTier[row.tier].push({
				userId: row.user_id,
				name: publicName(row.display_name),
				correct: Number(row.correct) || 0,
				rank: Number(row.rank) || 0
			});
		}
		return board;
	} catch {
		return emptyBoard();
	}
});
var fetchMe_createServerFn_handler = createServerRpc({
	id: "268d5ad94dbf5c33cc50a20c28eb26274c1df189eab0d38f03962ddc983e7c09",
	name: "fetchMe",
	filename: "src/game/rolls.ts"
}, (opts) => fetchMe.__executeServer(opts));
var fetchMe = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchMe_createServerFn_handler, async ({ context }) => {
	const rows = await (await getSql())`
      select
        a.tier,
        a.correct,
        (
          select count(*)::int + 1
          from vault_clears b
          where b.tier = a.tier
            and (
              b.correct > a.correct
              or (b.correct = a.correct and b.updated_at < a.updated_at)
              or (b.correct = a.correct and b.updated_at = a.updated_at and b.user_id < a.user_id)
            )
        ) as rank
      from vault_clears a
      where a.user_id = ${context.userId}
    `;
	const mine = emptyMine();
	for (const row of rows) {
		if (!ROLL_TIERS.includes(row.tier)) continue;
		mine.byTier[row.tier] = {
			correct: Number(row.correct) || 0,
			rank: Number(row.rank) || null
		};
	}
	return mine;
});
var reportCorrect_createServerFn_handler = createServerRpc({
	id: "378e9100a8f07d770d876b97289ea42d61d051e3850a0ef2edf65d9876fda45b",
	name: "reportCorrect",
	filename: "src/game/rolls.ts"
}, (opts) => reportCorrect.__executeServer(opts));
var reportCorrect = createServerFn({ method: "POST" }).validator((u) => object({ tier: TierSchema }).parse(u)).middleware([authMiddleware]).handler(reportCorrect_createServerFn_handler, async ({ context, data }) => {
	const sql = await getSql();
	const name = publicName((await sql`
      select name from "user" where id = ${context.userId} limit 1
    `)[0]?.name);
	const tier = data.tier;
	await sql`
      insert into vault_clears (user_id, display_name, tier, correct, updated_at)
      values (${context.userId}, ${name}, ${tier}, 1, now())
      on conflict (user_id, tier)
      do update set
        correct = vault_clears.correct + 1,
        display_name = excluded.display_name,
        updated_at = now()
    `;
	return { ok: true };
});
//#endregion
export { fetchBoard_createServerFn_handler, fetchMe_createServerFn_handler, reportCorrect_createServerFn_handler };
