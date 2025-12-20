import { router, protectedProcedure, freelancerProcedure, studentProcedure } from "../trpc"
import { z } from "zod"
import { projects, projectFiles, projectPurchases, users, notifications } from "../../db/schema"
import { eq, and, or, like, desc, ne } from "drizzle-orm"
import { db } from "../../db"
import { projectSchema } from "@/lib/validations"

export const marketplaceRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(projects.isActive, true)]

      if (input.category) {
        conditions.push(eq(projects.category, input.category))
      }

      if (input.search) {
        conditions.push(
          or(
            like(projects.title, `%${input.search}%`),
            like(projects.description, `%${input.search}%`)
          )!
        )
      }

      const results = await db.query.projects.findMany({
        where: and(...conditions),
        orderBy: desc(projects.createdAt),
        with: {
          freelancer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          files: true,
        },
      })

      return results
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.id),
        with: {
          freelancer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          files: true,
          purchases: {
            with: {
              student: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      })

      return project
    }),

  getMyProjects: freelancerProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    const myProjects = await db.query.projects.findMany({
      where: eq(projects.freelancerId, user.id),
      orderBy: desc(projects.createdAt),
      with: {
        files: true,
        purchases: {
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return myProjects
  }),

  create: freelancerProcedure
    .input(projectSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const [project] = await db
        .insert(projects)
        .values({
          freelancerId: user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          price: input.price.toString(),
          tags: input.tags ?? [],
          isActive: true,
        })
        .returning()

      return project
    }),

  addFiles: freelancerProcedure
    .input(
      z.object({
        projectId: z.string(),
        files: z.array(
          z.object({
            fileName: z.string(),
            fileUrl: z.string(),
            fileSize: z.number(),
            fileType: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.projectId),
          eq(projects.freelancerId, user.id)
        ),
      })

      if (!project) throw new Error("Project not found")

      const fileRecords = input.files.map((file) => ({
        projectId: input.projectId,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        fileType: file.fileType,
      }))

      await db.insert(projectFiles).values(fileRecords)

      return { success: true }
    }),

  update: freelancerProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        price: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.freelancerId, user.id)
        ),
      })

      if (!project) throw new Error("Project not found or not owned by you")

      const [updated] = await db
        .update(projects)
        .set({
          title: input.title ?? project.title,
          description: input.description ?? project.description,
          price: input.price?.toString() ?? project.price,
          isActive: input.isActive ?? project.isActive,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, input.id))
        .returning()

      return updated
    }),

  delete: freelancerProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const project = await db.query.projects.findFirst({
        where: and(
          eq(projects.id, input.id),
          eq(projects.freelancerId, user.id)
        ),
      })

      if (!project) throw new Error("Project not found or not owned by you")

      await db.delete(projects).where(eq(projects.id, input.id))

      return { success: true }
    }),

  purchase: studentProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const student = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!student) throw new Error("User not found")

      const project = await db.query.projects.findFirst({
        where: eq(projects.id, input.projectId),
        with: {
          freelancer: true,
        },
      })

      if (!project) throw new Error("Project not found")
      if (!project.isActive) throw new Error("Project is not available")

      const existingPurchase = await db.query.projectPurchases.findFirst({
        where: and(
          eq(projectPurchases.projectId, input.projectId),
          eq(projectPurchases.studentId, student.id)
        ),
      })

      if (existingPurchase) throw new Error("You have already purchased this project")

      const [purchase] = await db
        .insert(projectPurchases)
        .values({
          projectId: input.projectId,
          studentId: student.id,
          price: project.price,
        })
        .returning()

      const freelancer = project.freelancer as { id: string } | null
      if (freelancer) {
        await db.insert(notifications).values({
          userId: freelancer.id,
          title: "Project Purchased",
          message: `${student.firstName || "A student"} purchased your project: ${project.title}`,
          type: "marketplace",
          link: `/dashboard/freelancer/marketplace`,
        })
      }

      return purchase
    }),

  getMyPurchases: studentProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    const purchases = await db.query.projectPurchases.findMany({
      where: eq(projectPurchases.studentId, user.id),
      orderBy: desc(projectPurchases.purchasedAt),
      with: {
        project: {
          with: {
            freelancer: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            files: true,
          },
        },
      },
    })

    return purchases
  }),

  getStats: freelancerProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    const myProjects = await db.query.projects.findMany({
      where: eq(projects.freelancerId, user.id),
      with: {
        purchases: true,
      },
    })

    const totalSales = myProjects.reduce(
      (sum, p) => sum + p.purchases.length,
      0
    )

    const totalEarnings = myProjects.reduce(
      (sum, p) =>
        sum +
        p.purchases.reduce(
          (pSum, purchase) => pSum + (parseFloat(purchase.price) || 0),
          0
        ),
      0
    )

    return {
      totalProjects: myProjects.length,
      activeProjects: myProjects.filter((p) => p.isActive).length,
      totalSales,
      totalEarnings,
    }
  }),
})
