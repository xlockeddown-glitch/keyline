/**
 * 0.0.84: how server code resolves the signed-in walker from request headers.
 *
 * Better Auth's signed session-data cookie (cookieCache, 5 min) is trusted WITHOUT a database check. Password
 * reset and the link guard delete the session row immediately, so the lookup must skip that cache or the old
 * cookie keeps authorizing wallet and profile calls until it expires.
 */
export const SESSION_LOOKUP_QUERY = { disableCookieCache: true } as const;

type SessionApi = {
  getSession(opts: { headers: Headers; query?: { disableCookieCache?: boolean } }): Promise<{
    user?: { id: string; email?: string | null } | null;
  } | null>;
};

export async function sessionUserFromHeaders(
  api: SessionApi,
  headers: Headers,
): Promise<{ id: string; email: string | null } | null> {
  const session = await api.getSession({ headers, query: SESSION_LOOKUP_QUERY });
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? null };
}
