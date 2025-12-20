import { router, protectedProcedure } from "../trpc"
import { z } from "zod"
import { calendarEvents, users } from "../../db/schema"
import { eq, and, gte, lte } from "drizzle-orm"
import { db } from "../../db"
import { calendarEventSchema } from "@/lib/validations"

export const calendarRouter = router({
  create: protectedProcedure
    .input(calendarEventSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const [event] = await db
        .insert(calendarEvents)
        .values({
          userId: user.id,
          assignmentId: input.assignmentId,
          title: input.title,
          description: input.description,
          startDate: input.startDate,
          endDate: input.endDate,
        })
        .returning()

      return event
    }),

  list: protectedProcedure
    .input(
      z.object({
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const conditions = [eq(calendarEvents.userId, user.id)]

      if (input.startDate) {
        conditions.push(gte(calendarEvents.startDate, input.startDate))
      }

      if (input.endDate) {
        conditions.push(lte(calendarEvents.startDate, input.endDate))
      }

      const events = await db.query.calendarEvents.findMany({
        where: and(...conditions),
        with: {
          assignment: true,
        },
      })

      return events
    }),
})

