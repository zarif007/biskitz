import z from 'zod'
import { baseProcedure, createTRPCRouter } from '@/trpc/init'
import prisma from '@/lib/db'
import { generateSlug } from 'random-word-slugs'
import { TRPCError } from '@trpc/server'

export const projectsRouter = createTRPCRouter({
  getOne: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, 'Project ID is required'),
      })
    )
    .query(async ({ input }) => {
      const project = await prisma.project.findUnique({
        where: {
          id: input.id,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          user: {},
        },
      })

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      return project
    }),

  getMany: baseProcedure.query(async () => {
    return prisma.project.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    })
  }),

  create: baseProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, 'Prompt cannot be empty')
          .max(5000, 'Prompt is too long'),
        packageType: z.enum(['NPM', 'COMPONENT', 'SDK']).default('NPM'),
        tddEnabled: z.boolean().default(false),
        inputTokens: z.number().min(0).default(0),
        outputTokens: z.number().min(0).default(0),
        timeTaken: z.number().min(0).default(0),
        model: z.string(),
        context: z.any(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!ctx.session?.user?.email) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be logged in to create a project',
        })
      }

      const createdProject = await prisma.project.create({
        data: {
          name: generateSlug(2, { format: 'kebab' }),
          user: {
            connect: { email: ctx.session.user.email },
          },
          packageType: input.packageType,
          tddEnabled: input.tddEnabled,
          context: input.context,
          messages: {
            create: {
              content: input.value,
              role: 'USER',
              type: 'RESULT',
              state: 'INIT',
              timeTaken: input.timeTaken,
              inputTokens: input.inputTokens,
              outputTokens: input.outputTokens,
              model: input.model,
            },
          },
        },
      })

      return createdProject
    }),

  update: baseProcedure
    .input(
      z.object({
        id: z.string().min(1, 'Project ID is required'),
        data: z
          .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
          .refine((val) => Object.keys(val).length > 0, {
            message: 'At least one field is required to update',
          }),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await prisma.project.findUnique({
        where: { id: input.id },
      })

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      const updated = await prisma.project.update({
        where: { id: input.id },
        data: input.data,
      })

      return updated
    }),
})
