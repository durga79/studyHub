import { router, protectedProcedure, adminProcedure, superAdminProcedure } from "../trpc"
import { z } from "zod"
import { users, notifications } from "../../db/schema"
import { eq, and, or, like, desc, ne } from "drizzle-orm"
import { db } from "../../db"

export const usersRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    return user
  }),

  getAll: superAdminProcedure.query(async () => {
    const allUsers = await db.query.users.findMany({
      orderBy: desc(users.createdAt),
    })
    return allUsers
  }),

  approve: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(users)
        .set({
          isApproved: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      await db.insert(notifications).values({
        userId: input.userId,
        title: "Account Approved",
        message: "Your account has been approved! You now have full access.",
        type: "account",
      })

      return updated
    }),

  updateRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.userId) {
        throw new Error("Cannot change your own role")
      }

      const [updated] = await db
        .update(users)
        .set({
          role: input.role as any,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      await db.insert(notifications).values({
        userId: input.userId,
        title: "Role Changed",
        message: `Your account role has been changed to ${input.role}`,
        type: "account",
      })

      return updated
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const [updated] = await db
        .update(users)
        .set({
          firstName: input.firstName ?? user.firstName,
          lastName: input.lastName ?? user.lastName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning()

      return updated
    }),

  list: adminProcedure
    .input(
      z.object({
        role: z.enum(["student", "freelancer", "admin", "super_admin"]).optional(),
        search: z.string().optional(),
        approved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = []

      if (input.role) {
        conditions.push(eq(users.role, input.role))
      }

      if (input.search) {
        conditions.push(
          or(
            like(users.firstName, `%${input.search}%`),
            like(users.lastName, `%${input.search}%`),
            like(users.email, `%${input.search}%`)
          )!
        )
      }

      if (input.approved !== undefined) {
        conditions.push(eq(users.isApproved, input.approved))
      }

      const allUsers = await db.query.users.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(users.createdAt),
      })

      return allUsers
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.id),
      })

      return user
    }),

  listFreelancers: adminProcedure
    .input(
      z.object({
        approved: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(users.role, "freelancer")]

      if (input.approved !== undefined) {
        conditions.push(eq(users.isApproved, input.approved))
      }

      const freelancers = await db.query.users.findMany({
        where: and(...conditions),
        orderBy: desc(users.createdAt),
      })

      return freelancers
    }),

  approveFreelancer: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!admin) throw new Error("Admin not found")

      const freelancer = await db.query.users.findFirst({
        where: and(
          eq(users.id, input.userId),
          eq(users.role, "freelancer")
        ),
      })

      if (!freelancer) throw new Error("Freelancer not found")

      const [updated] = await db
        .update(users)
        .set({
          isApproved: input.approved,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      await db.insert(notifications).values({
        userId: input.userId,
        title: input.approved ? "Account Approved" : "Account Status Updated",
        message: input.approved
          ? "Your freelancer account has been approved! You can now accept assignments."
          : "Your freelancer account approval has been revoked.",
        type: "account",
      })

      return updated
    }),

  changeRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["student", "freelancer", "admin", "super_admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!superAdmin) throw new Error("Super admin not found")

      if (superAdmin.id === input.userId) {
        throw new Error("Cannot change your own role")
      }

      const [updated] = await db
        .update(users)
        .set({
          role: input.role,
          isApproved: input.role === "freelancer" ? false : true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId))
        .returning()

      await db.insert(notifications).values({
        userId: input.userId,
        title: "Role Changed",
        message: `Your account role has been changed to ${input.role}`,
        type: "account",
      })

      return updated
    }),

  deleteUser: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const superAdmin = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!superAdmin) throw new Error("Super admin not found")

      if (superAdmin.id === input.userId) {
        throw new Error("Cannot delete your own account")
      }

      await db.delete(users).where(eq(users.id, input.userId))

      return { success: true }
    }),

  getStats: adminProcedure.query(async () => {
    const allUsers = await db.query.users.findMany()

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const newUsersThisMonth = allUsers.filter(
      (u) => new Date(u.createdAt) >= thisMonth
    )

    return {
      total: allUsers.length,
      students: allUsers.filter((u) => u.role === "student").length,
      freelancers: allUsers.filter((u) => u.role === "freelancer").length,
      admins: allUsers.filter((u) => u.role === "admin").length,
      superAdmins: allUsers.filter((u) => u.role === "super_admin").length,
      approvedFreelancers: allUsers.filter(
        (u) => u.role === "freelancer" && u.isApproved
      ).length,
      pendingFreelancers: allUsers.filter(
        (u) => u.role === "freelancer" && !u.isApproved
      ).length,
      newThisMonth: newUsersThisMonth.length,
    }
  }),
})
