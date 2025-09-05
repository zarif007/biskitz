import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import codeGen from "@/functions/codeGen";

export const appRouter = createTRPCRouter({
  invoke: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log("Invoking codeGen with prompt:", input.text);
      return await codeGen(input.text);
    }),
});

export type AppRouter = typeof appRouter;
