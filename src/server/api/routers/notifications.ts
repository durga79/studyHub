import { router, protectedProcedure } from "../trpc"
import { z } from "zod"
import { notifications, users } from "../../db/schema"
import { eq, and, desc } from "drizzle-orm"
import { db } from "../../db"

export const notificationsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const conditions = [eq(notifications.userId, user.id)]

      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false))
      }

      const userNotifications = await db.query.notifications.findMany({
        where: and(...conditions),
        orderBy: desc(notifications.createdAt),
      })

      return userNotifications
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [notification] = await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, input.id))
        .returning()

      return notification
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, user.id))

    return { success: true }
  }),
})

