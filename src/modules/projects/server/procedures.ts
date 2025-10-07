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
      const project = prisma.project.findUnique({
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
          messages: {
            create: {
              content: input.value,
              role: 'USER',
              type: 'RESULT',
              timeTaken: 0,
              totalTokens: 0,
            },
          },
        },
      })

      return createdProject
    }),
})
