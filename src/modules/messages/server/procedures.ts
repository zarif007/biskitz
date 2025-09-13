import z from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import codeGen from "@/functions/codeGen";

export const messageRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(
      z.object({
        projectId: z.string().min(1, "Project ID is required"),
      })
    )
    .query(async ({ input }) => {
      return prisma.message.findMany({
        where: {
          projectId: input.projectId,
        },
        include: {
          fragment: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    }),
  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, "Message cannot be empty")
          .max(5000, "Message is too long"),
        projectId: z.string().min(1, "Project ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });

      const res = await codeGen(input.value, input.projectId);
      console.log(res);
      return createdMessage;
    }),
});
