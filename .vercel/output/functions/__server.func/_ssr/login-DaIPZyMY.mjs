import { _ as Link, b as require_jsx_runtime, v as Navigate } from "../_libs/@tanstack/react-router--chunk.mjs";
import { r as signIn, t as authClient } from "./client-DkwNByA6.mjs";
import { t as GROK_PROVIDERS } from "./server-BTgwu_9i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-DaIPZyMY.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
function SignInActions({ callbackURL = "/" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex w-full flex-col gap-2",
		children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "btn btn-ghost w-full",
			onClick: () => signIn(p.providerId, { callbackURL }),
			children: ["Continue with ", p.label]
		}, p.providerId))
	});
}
function Login() {
	const { user, isPending } = useCurrentUserState();
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "title-night",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "title-pave",
			"aria-hidden": true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "title-folio",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "street-blade",
					"aria-label": "Keyline",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Standings" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "KEYLINE" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "lede",
					children: "Sign in to post plates under your name. Guests can still read the board."
				}),
				isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-11 animate-pulse rounded-md bg-bg-subtle",
					"aria-hidden": true
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignInActions, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "title-more",
					children: "Back to the street"
				})
			]
		})]
	});
}
//#endregion
export { Login as component };
