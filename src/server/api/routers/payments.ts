import { router, protectedProcedure, adminProcedure, studentProcedure } from "../trpc"
import { z } from "zod"
import { payments, paymentScreenshots, users, assignments, notifications, referrals } from "../../db/schema"
import { eq, desc, and } from "drizzle-orm"
import { db } from "../../db"
import { REFERRAL_REWARD } from "@/lib/constants"

export const paymentsRouter = router({
  create: studentProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        freelancerId: z.string(),
        amount: z.number().positive(),
        upiId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!student) throw new Error("User not found")

      const assignment = await db.query.assignments.findFirst({
        where: and(
          eq(assignments.id, input.assignmentId),
          eq(assignments.studentId, student.id)
        ),
      })

      if (!assignment) throw new Error("Assignment not found")
      if (assignment.status !== "completed") {
        throw new Error("Assignment must be completed before payment")
      }

      const existingPayment = await db.query.payments.findFirst({
        where: and(
          eq(payments.assignmentId, input.assignmentId),
          eq(payments.status, "pending")
        ),
      })

      if (existingPayment) {
        throw new Error("A pending payment already exists for this assignment")
      }

      const [payment] = await db
        .insert(payments)
        .values({
          assignmentId: input.assignmentId,
          studentId: student.id,
          freelancerId: input.freelancerId,
          amount: input.amount.toString(),
          upiId: input.upiId,
          status: "pending",
        })
        .returning()

      const freelancer = await db.query.users.findFirst({
        where: eq(users.id, input.freelancerId),
      })

      if (freelancer) {
        await db.insert(notifications).values({
          userId: freelancer.id,
          title: "Payment Initiated",
          message: `Payment of $${input.amount} has been initiated for "${assignment.title}"`,
          type: "payment",
          link: `/dashboard/freelancer/my-assignments`,
        })
      }

      return payment
    }),

  addScreenshot: studentProcedure
    .input(
      z.object({
        paymentId: z.string(),
        fileUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const student = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!student) throw new Error("User not found")

      const payment = await db.query.payments.findFirst({
        where: and(
          eq(payments.id, input.paymentId),
          eq(payments.studentId, student.id)
        ),
      })

      if (!payment) throw new Error("Payment not found")

      const [screenshot] = await db
        .insert(paymentScreenshots)
        .values({
          paymentId: input.paymentId,
          fileUrl: input.fileUrl,
        })
        .returning()

      return screenshot
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "verified", "rejected"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const conditions = []

      if (user.role === "student") {
        conditions.push(eq(payments.studentId, user.id))
      } else if (user.role === "freelancer") {
        conditions.push(eq(payments.freelancerId, user.id))
      }

      if (input.status) {
        conditions.push(eq(payments.status, input.status))
      }

      const results = await db.query.payments.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(payments.createdAt),
        with: {
          assignment: true,
          student: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          freelancer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          screenshots: true,
        },
      })

      return results
    }),

  listPending: adminProcedure.query(async () => {
    const pendingPayments = await db.query.payments.findMany({
      where: eq(payments.status, "pending"),
      orderBy: desc(payments.createdAt),
      with: {
        assignment: true,
        student: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        freelancer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        screenshots: true,
      },
    })

    return pendingPayments
  }),

  listAll: adminProcedure
    .input(
      z.object({
        status: z.enum(["pending", "verified", "rejected"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const conditions = []

      if (input.status) {
        conditions.push(eq(payments.status, input.status))
      }

      const allPayments = await db.query.payments.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: desc(payments.createdAt),
        with: {
          assignment: true,
          student: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          freelancer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          screenshots: true,
          verifier: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      })

      return allPayments
    }),

  verify: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        status: z.enum(["verified", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!admin) throw new Error("User not found")

      const payment = await db.query.payments.findFirst({
        where: eq(payments.id, input.paymentId),
        with: {
          assignment: true,
          student: true,
          freelancer: true,
        },
      })

      if (!payment) throw new Error("Payment not found")

      const paymentAssignment = payment.assignment as { title: string } | null

      const [updatedPayment] = await db
        .update(payments)
        .set({
          status: input.status,
          verifiedBy: admin.id,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, input.paymentId))
        .returning()

      if (input.status === "verified") {
        await db
          .update(assignments)
          .set({ status: "paid", updatedAt: new Date() })
          .where(eq(assignments.id, payment.assignmentId))

        await db.insert(notifications).values({
          userId: payment.freelancerId,
          title: "Payment Verified",
          message: `Payment of $${payment.amount} for "${paymentAssignment?.title || "Assignment"}" has been verified`,
          type: "payment",
          link: `/dashboard/freelancer/my-assignments`,
        })

        await db.insert(notifications).values({
          userId: payment.studentId,
          title: "Payment Confirmed",
          message: `Your payment for "${paymentAssignment?.title || "Assignment"}" has been verified`,
          type: "payment",
          link: `/dashboard/student/assignments/${payment.assignmentId}`,
        })

        const referral = await db.query.referrals.findFirst({
          where: and(
            eq(referrals.referredId, payment.studentId),
            eq(referrals.isVerified, false)
          ),
        })

        if (referral) {
          await db
            .update(referrals)
            .set({
              assignmentId: payment.assignmentId,
              isVerified: true,
              verifiedBy: admin.id,
              verifiedAt: new Date(),
              rewardAmount: REFERRAL_REWARD.toString(),
              updatedAt: new Date(),
            })
            .where(eq(referrals.id, referral.id))

          await db.insert(notifications).values({
            userId: referral.referrerId,
            title: "Referral Reward Earned",
            message: `You earned $${REFERRAL_REWARD} for referring a student!`,
            type: "referral",
            link: `/dashboard/student/referrals`,
          })
        }
      } else {
        await db.insert(notifications).values({
          userId: payment.studentId,
          title: "Payment Rejected",
          message: `Your payment for "${paymentAssignment?.title || "Assignment"}" was rejected. Please try again.`,
          type: "payment",
          link: `/dashboard/student/assignments/${payment.assignmentId}`,
        })
      }

      return updatedPayment
    }),

  getStats: adminProcedure.query(async () => {
    const allPayments = await db.query.payments.findMany()

    const verifiedPayments = allPayments.filter((p) => p.status === "verified")
    const totalAmount = verifiedPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    )

    const thisMonth = new Date()
    thisMonth.setDate(1)
    thisMonth.setHours(0, 0, 0, 0)

    const thisMonthPayments = verifiedPayments.filter(
      (p) => p.verifiedAt && new Date(p.verifiedAt) >= thisMonth
    )
    const thisMonthAmount = thisMonthPayments.reduce(
      (sum, p) => sum + (parseFloat(p.amount) || 0),
      0
    )

    return {
      total: allPayments.length,
      pending: allPayments.filter((p) => p.status === "pending").length,
      verified: verifiedPayments.length,
      rejected: allPayments.filter((p) => p.status === "rejected").length,
      totalAmount,
      thisMonthAmount,
    }
  }),
})
