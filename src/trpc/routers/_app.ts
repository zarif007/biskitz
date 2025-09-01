import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { inngest } from "@/inngest/client";

export const appRouter = createTRPCRouter({
  invoke: baseProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await inngest.send({
        name: "biskitz/hello",
        data: {
          text: input.text,
        },
      });
    }),
});

export type AppRouter = typeof appRouter;
