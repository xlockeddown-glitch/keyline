/**
 * Auth email (password reset, email verification) — server-only.
 *
 * One small interface so the auth config never cares who delivers the mail:
 *   - `RESEND_API_KEY` + `AUTH_EMAIL_FROM` set -> Resend's HTTP API (plain fetch, no SDK, so the server function
 *     stays small).
 *   - neither set, not production (local `npm run dev`, Grok Build's preview) -> logs the email, link included, to
 *     the server console so the flow can be tested end to end.
 *   - neither set, production -> no mailer: reset / verification are switched off and the sign-in sheet says so.
 */
export type AuthEmail = { to: string; subject: string; text: string; html: string };

export interface Mailer {
  readonly kind: "resend" | "dev-log";
  send(msg: AuthEmail): Promise<void>;
}

type Env = Record<string, string | undefined>;
type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

const val = (env: Env, key: string) => {
  const v = env[key]?.trim();
  return v ? v : undefined;
};

export const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function mailerFromEnv(
  env: Env = process.env,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
  log: (line: string) => void = (line) => console.log(line),
): Mailer | null {
  const key = val(env, "RESEND_API_KEY");
  const from = val(env, "AUTH_EMAIL_FROM");
  if (key && from) {
    return {
      kind: "resend",
      async send(msg) {
        const res = await fetchImpl(RESEND_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text, html: msg.html }),
        });
        if (!res.ok) {
          // Never log the key or the link; status + Resend's short error is enough to debug.
          const detail = (await res.text().catch(() => "")).slice(0, 200);
          throw new Error(`[auth-mail] resend failed status=${res.status} ${detail}`);
        }
      },
    };
  }
  if (val(env, "NODE_ENV") === "production") return null;
  return {
    kind: "dev-log",
    async send(msg) {
      log(`[auth-mail] (dev, not sent) to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
    },
  };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

/** Display names are interpolated into the text part. Strip header-like breaks and control chars. */
function plainName(name: string): string {
  return name.replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

/**
 * Auth links carry a bearer token in the path. Two ways that token leaves the app:
 *   - `X-Forwarded-Host` (trusted by Better Auth when the base URL is dynamic) can aim the link at
 *     another `*.grok-sandbox.com` host. A pinned `BETTER_AUTH_URL` replaces that origin. With no pin,
 *     real mail is refused unless the link host is the request's own `Host` header.
 *   - An absolute `callbackURL` / `redirectTo` (loopback is in the dev allow-list) makes the click
 *     handler 302 the token off-origin. Absolute callbacks are folded back to a same-origin path.
 */
export function canonicalAuthLink(
  url: string,
  env: Env = process.env,
  request?: { headers: { get(name: string): string | null } } | null,
  realMail = false,
): string {
  const u = new URL(url);
  const pinned = val(env, "BETTER_AUTH_URL");
  if (pinned) {
    const base = new URL(pinned);
    u.protocol = base.protocol;
    u.host = base.host;
  } else if (realMail) {
    const host = request?.headers.get("host")?.split(",")[0]?.trim() ?? "";
    if (!host || u.host.toLowerCase() !== host.toLowerCase()) {
      throw new Error("refusing to email an auth link whose host is not this app");
    }
  }
  const callback = u.searchParams.get("callbackURL");
  if (callback && (/^[a-z][a-z0-9+.-]*:/i.test(callback) || callback.startsWith("//") || callback.startsWith("/\\") || callback.includes("\\"))) {
    u.searchParams.set("callbackURL", u.pathname.includes("/reset-password/") ? "/reset-password" : "/");
  }
  return u.toString();
}

function safeAddress(to: string): string {
  const addr = to.trim();
  if (!addr || /[\r\n]/.test(addr) || addr.length > 320) throw new Error("refusing to email a malformed address");
  return addr;
}

function letter(opts: { name: string; lead: string; cta: string; url: string; foot: string }): Omit<AuthEmail, "to" | "subject"> {
  const hi = plainName(opts.name) ? `Hi ${plainName(opts.name)},` : "Hi,";
  const text = `${hi}\n\n${opts.lead}\n\n${opts.cta}: ${opts.url}\n\n${opts.foot}\n\n— Keyline`;
  const html = `<div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:24px;color:#2b2118;background:#f6efe2">
<p style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#8a6a3a;margin:0 0 12px">Keyline</p>
<p>${esc(hi)}</p><p>${esc(opts.lead)}</p>
<p style="margin:24px 0"><a href="${esc(opts.url)}" style="background:#2b2118;color:#f6c76b;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:bold">${esc(opts.cta)}</a></p>
<p style="font-size:13px;color:#6b5a45">${esc(opts.foot)}</p></div>`;
  return { text, html };
}

export function resetPasswordEmail(to: string, name: string, url: string): AuthEmail {
  return {
    to: safeAddress(to),
    subject: "Reset your Keyline password",
    ...letter({
      name,
      lead: "Someone (hopefully you) asked to reset the password on your Keyline account.",
      cta: "Choose a new password",
      url,
      foot: "The link works once and expires in an hour. If you didn't ask for this, ignore this email; your password stays the same.",
    }),
  };
}

export function verifyEmail(to: string, name: string, url: string): AuthEmail {
  return {
    to: safeAddress(to),
    subject: "Confirm your Keyline email",
    ...letter({
      name,
      lead: "Confirm this email address so you can always get back into your Keyline account.",
      cta: "Confirm email",
      url,
      foot: "If you didn't make a Keyline account, ignore this email.",
    }),
  };
}
