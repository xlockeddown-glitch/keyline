import { createMiddleware } from "@tanstack/react-start";

/**
 * Optional-auth middleware (0.0.53, trivia deal/grade): like `authMiddleware` but a signed-out caller is a guest
 * (`context.userId === null`) instead of a 401, so lamps play without an account. Only the verified session id
 * is ever used — never a client-sent id. Same-site check and preview bearer forwarding as `authMiddleware`.
 */
export const viewerMiddleware = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    const { getBearerToken } = await import("./client");
    return next({ sendContext: { bearerToken: getBearerToken() ?? undefined } });
  })
  .server(async ({ next, context }) => {
    const { assertSameSiteRequest } = await import("./isolation.server");
    const { getSessionUser } = await import("./verify.server");
    assertSameSiteRequest();
    let userId: string | null = null;
    try {
      userId = (await getSessionUser(context.bearerToken))?.id ?? null;
    } catch {
      userId = null;
    }
    return next({ context: { userId } });
  });
