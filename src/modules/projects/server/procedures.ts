import z from "zod";
import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import prisma from "@/lib/db";
import codeGen from "@/functions/codeGen";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";

export const projectsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, "Project ID is required"),
      })
    )
    .query(async ({ input }) => {
      const project = prisma.project.findUnique({
        where: {
          id: input.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project;
    }),
  getMany: baseProcedure.query(async () => {
    return prisma.project.findMany({
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
          .min(1, "Prompt cannot be empty")
          .max(5000, "Prompt is too long"),
      })
    )
    .mutation(async ({ input }) => {
      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: "kebab" }),
          messages: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      await codeGen(input.value, createdProject.id);

      return createdProject;
    }),
});
