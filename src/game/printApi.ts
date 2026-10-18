import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { PrintRow } from "./printsServer";

/** 0.0.99: the signed-in player's city-print progress, from server records only. */
export const fetchPrints = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<PrintRow[]> => {
    const { printLook } = await import("./printsServer");
    return printLook(await getSql(), context.userId);
  });
