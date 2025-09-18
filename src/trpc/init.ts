import { initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { auth } from "../auth";

export const createTRPCContext = cache(async () => {
  const session = await auth();
  return { session };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
