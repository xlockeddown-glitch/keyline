import { createServerFn } from "@tanstack/react-start";
import { viewerMiddleware } from "@/lib/auth/viewer-middleware";
import { DealIn, GradeIn, type DealResult, type GradeResult } from "./triviaSchema";

/**
 * 0.0.53 — trivia cards come from the server. `dealTrivia` picks and shuffles a card and returns it without the
 * answer, plus a signed pending-card token; `gradeTrivia` takes the token and the chosen text, grades it on the
 * server clock and only then reveals the answer. Guests play too (anonymous token); a signed-in walker's plate
 * event and rolls clear are written here by the server. The bank is loaded by dynamic import inside the
 * handlers so it stays out of the browser bundle (see triviaService.ts, `npm run qa:no-answers`).
 */
export const dealTrivia = createServerFn({ method: "POST" })
  .validator((u: unknown) => DealIn.parse(u))
  .middleware([viewerMiddleware])
  .handler(async ({ context, data }): Promise<DealResult> => {
    const { triviaDeps } = await import("./triviaBank");
    const { dealFor } = await import("./triviaService");
    return dealFor(await triviaDeps(), { userId: context.userId }, data);
  });

export const gradeTrivia = createServerFn({ method: "POST" })
  .validator((u: unknown) => GradeIn.parse(u))
  .middleware([viewerMiddleware])
  .handler(async ({ context, data }): Promise<GradeResult> => {
    const { triviaDeps } = await import("./triviaBank");
    const { grade } = await import("./triviaService");
    return grade(await triviaDeps(), { userId: context.userId }, data);
  });
