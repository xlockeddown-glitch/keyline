import { createServerFn } from "@tanstack/react-start";

/** What the sign-in sheet may offer: reset / confirmation mail only once a mailer exists (see `mailer.server`). */
export type EmailAuthFeatures = { resetEnabled: boolean; devLog: boolean };

export const getEmailAuthFeatures = createServerFn({ method: "GET" }).handler(async (): Promise<EmailAuthFeatures> => {
  const { mailerFromEnv } = await import("./mailer.server");
  const mailer = mailerFromEnv();
  return { resetEnabled: Boolean(mailer), devLog: mailer?.kind === "dev-log" };
});
