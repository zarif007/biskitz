import z from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import codeGen from "@/functions/codeGen";
import { FragmentType, MessageRole, MessageType } from "@/generated/prisma";

export const FragmentSchema = z.object({
  type: z.nativeEnum(FragmentType),
  sandboxUrl: z.string().url().optional().nullable(),
  title: z.string(),
  files: z.any(),
});

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
        content: z
          .string()
          .min(0)
          .max(5000, "Message is too long"),
        projectId: z.string().min(1, "Project ID is required"),
        role: z.nativeEnum(MessageRole),
        type: z.nativeEnum(MessageType),
        fragment: FragmentSchema.optional(),
      })
    )
    .mutation(async ({ input }) => {
      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: input.content,
          role: input.role,
          type: input.type,
          fragment: input.fragment
            ? {
                create: input.fragment,
              }
            : undefined,
        },
      });

      return createdMessage;
    }),
});
