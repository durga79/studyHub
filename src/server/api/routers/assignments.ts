import { router, protectedProcedure, studentProcedure, freelancerProcedure, adminProcedure } from "../trpc"
import { z } from "zod"
import { assignments, assignmentFiles, assignmentsFreelancers, users, notifications, calendarEvents } from "../../db/schema"
import { eq, and, desc, or, like, ne, sql } from "drizzle-orm"
import { db } from "../../db"
import { assignmentSchema } from "@/lib/validations"

export const assignmentsRouter = router({
  create: studentProcedure
    .input(assignmentSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const [assignment] = await db
        .insert(assignments)
        .values({
          studentId: user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          tags: input.tags && input.tags.length > 0 ? input.tags : null,
          deadline: input.deadline,
          videoRequirements: input.videoRequirements,
          price: input.price?.toString(),
          status: "draft",
        })
        .returning()

      if (input.deadline) {
        await db.insert(calendarEvents).values({
          userId: user.id,
          assignmentId: assignment.id,
          title: `Deadline: ${assignment.title}`,
          description: `Assignment deadline`,
          startDate: input.deadline,
        })
      }

      return assignment
    }),

  addFiles: studentProcedure
    .input(
      z.object({
        assignmentId: z.string(),
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

      const assignment = await db.query.assignments.findFirst({
        where: and(
          eq(assignments.id, input.assignmentId),
          eq(assignments.studentId, user.id)
        ),
      })

      if (!assignment) throw new Error("Assignment not found")

      const fileRecords = input.files.map((file) => ({
        assignmentId: input.assignmentId,
        fileName: file.fileName,
        fileUrl: file.fileUrl,
        fileSize: file.fileSize,
        fileType: file.fileType,
      }))

      await db.insert(assignmentFiles).values(fileRecords)

      return { success: true }
    }),

  publish: studentProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const assignment = await db.query.assignments.findFirst({
        where: and(
          eq(assignments.id, input.id),
          eq(assignments.studentId, user.id)
        ),
      })

      if (!assignment) throw new Error("Assignment not found")
      if (assignment.status !== "draft") throw new Error("Assignment is not a draft")

      const [updated] = await db
        .update(assignments)
        .set({ status: "posted", updatedAt: new Date() })
        .where(eq(assignments.id, input.id))
        .returning()

      return updated
    }),

  list: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        category: z.string().optional(),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "price", "deadline"]).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        myAssignments: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const conditions = []

      if (input.myAssignments && user.role === "student") {
        conditions.push(eq(assignments.studentId, user.id))
      }

      if (input.status) {
        conditions.push(eq(assignments.status, input.status as any))
      }

      if (input.category) {
        conditions.push(eq(assignments.category, input.category))
      }

      if (input.search) {
        conditions.push(
          or(
            like(assignments.title, `%${input.search}%`),
            like(assignments.description, `%${input.search}%`)
          )!
        )
      }

      let orderBy = desc(assignments.createdAt)
      if (input.sortBy === "price") {
        orderBy = desc(assignments.price)
      } else if (input.sortBy === "deadline") {
        orderBy = desc(assignments.deadline)
      }

      const results = await db.query.assignments.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy,
        with: {
          student: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          files: true,
          freelancers: {
            with: {
              freelancer: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      return results
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, input.id),
        with: {
          student: true,
          files: true,
          freelancers: {
            with: {
              freelancer: true,
            },
          },
          payments: {
            with: {
              screenshots: true,
            },
          },
        },
      })

      return assignment
    }),

  getMyAssignedWork: freelancerProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    const myWork = await db.query.assignmentsFreelancers.findMany({
      where: eq(assignmentsFreelancers.freelancerId, user.id),
      with: {
        assignment: {
          with: {
            student: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            files: true,
          },
        },
      },
      orderBy: desc(assignmentsFreelancers.createdAt),
    })

    return myWork
  }),

  accept: freelancerProcedure
    .input(z.object({ assignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")
      if (!user.isApproved) throw new Error("Your account is not approved yet")

      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, input.assignmentId),
      })

      if (!assignment) throw new Error("Assignment not found")
      if (assignment.status !== "posted") throw new Error("Assignment is not available")

      const existing = await db.query.assignmentsFreelancers.findFirst({
        where: and(
          eq(assignmentsFreelancers.assignmentId, input.assignmentId),
          eq(assignmentsFreelancers.freelancerId, user.id)
        ),
      })

      if (existing) throw new Error("You have already accepted this assignment")

      const [assignmentFreelancer] = await db
        .insert(assignmentsFreelancers)
        .values({
          assignmentId: input.assignmentId,
          freelancerId: user.id,
        })
        .returning()

      await db
        .update(assignments)
        .set({ status: "assigned", updatedAt: new Date() })
        .where(eq(assignments.id, input.assignmentId))

      await db.insert(notifications).values({
        userId: assignment.studentId,
        title: "Assignment Accepted",
        message: `A freelancer has accepted your assignment: ${assignment.title}`,
        type: "assignment",
        link: `/dashboard/student/assignments/${assignment.id}`,
      })

      await db.insert(calendarEvents).values({
        userId: user.id,
        assignmentId: assignment.id,
        title: `Deadline: ${assignment.title}`,
        description: `Assignment deadline`,
        startDate: assignment.deadline,
      })

      return assignmentFreelancer
    }),

  startWork: freelancerProcedure
    .input(z.object({ assignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const assignmentFreelancer = await db.query.assignmentsFreelancers.findFirst({
        where: and(
          eq(assignmentsFreelancers.assignmentId, input.assignmentId),
          eq(assignmentsFreelancers.freelancerId, user.id)
        ),
      })

      if (!assignmentFreelancer) throw new Error("You have not accepted this assignment")

      await db
        .update(assignments)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(assignments.id, input.assignmentId))

      return { success: true }
    }),

  submitWork: freelancerProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        files: z.array(z.string()),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const assignmentFreelancer = await db.query.assignmentsFreelancers.findFirst({
        where: and(
          eq(assignmentsFreelancers.assignmentId, input.assignmentId),
          eq(assignmentsFreelancers.freelancerId, user.id)
        ),
      })

      if (!assignmentFreelancer) throw new Error("You have not accepted this assignment")

      const assignment = await db.query.assignments.findFirst({
        where: eq(assignments.id, input.assignmentId),
      })

      if (!assignment) throw new Error("Assignment not found")

      await db
        .update(assignmentsFreelancers)
        .set({
          submittedAt: new Date(),
          submittedFiles: input.files,
          updatedAt: new Date(),
        })
        .where(eq(assignmentsFreelancers.id, assignmentFreelancer.id))

      await db
        .update(assignments)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(eq(assignments.id, input.assignmentId))

      await db.insert(notifications).values({
        userId: assignment.studentId,
        title: "Work Submitted",
        message: `Freelancer has submitted work for: ${assignment.title}`,
        type: "assignment",
        link: `/dashboard/student/assignments/${assignment.id}`,
      })

      return { success: true }
    }),

  reviewSubmission: studentProcedure
    .input(
      z.object({
        assignmentId: z.string(),
        approved: z.boolean(),
        feedback: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      const assignment = await db.query.assignments.findFirst({
        where: and(
          eq(assignments.id, input.assignmentId),
          eq(assignments.studentId, user.id)
        ),
        with: {
          freelancers: {
            with: {
              freelancer: true,
            },
          },
        },
      })

      if (!assignment) throw new Error("Assignment not found")
      if (assignment.status !== "submitted") throw new Error("No submission to review")

      const freelancer = assignment.freelancers[0]?.freelancer

      if (input.approved) {
        await db
          .update(assignments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(assignments.id, input.assignmentId))

        if (freelancer) {
          await db.insert(notifications).values({
            userId: freelancer.id,
            title: "Work Approved",
            message: `Your work on "${assignment.title}" has been approved!`,
            type: "assignment",
            link: `/dashboard/freelancer/my-assignments`,
          })
        }
      } else {
        await db
          .update(assignments)
          .set({ status: "in_progress", updatedAt: new Date() })
          .where(eq(assignments.id, input.assignmentId))

        if (freelancer) {
          await db.insert(notifications).values({
            userId: freelancer.id,
            title: "Revision Requested",
            message: `Revision requested for "${assignment.title}": ${input.feedback || "Please check messages"}`,
            type: "assignment",
            link: `/dashboard/freelancer/my-assignments`,
          })
        }
      }

      return { success: true }
    }),

  markAsPaid: adminProcedure
    .input(z.object({ assignmentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(assignments)
        .set({ status: "paid", updatedAt: new Date() })
        .where(eq(assignments.id, input.assignmentId))

      return { success: true }
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    if (user.role === "student") {
      const allAssignments = await db.query.assignments.findMany({
        where: eq(assignments.studentId, user.id),
      })

      const stats = {
        total: allAssignments.length,
        draft: allAssignments.filter((a) => a.status === "draft").length,
        posted: allAssignments.filter((a) => a.status === "posted").length,
        inProgress: allAssignments.filter((a) => ["assigned", "in_progress"].includes(a.status)).length,
        submitted: allAssignments.filter((a) => a.status === "submitted").length,
        completed: allAssignments.filter((a) => ["completed", "paid"].includes(a.status)).length,
      }

      return stats
    }

    if (user.role === "freelancer") {
      const myWork = await db.query.assignmentsFreelancers.findMany({
        where: eq(assignmentsFreelancers.freelancerId, user.id),
      })

      const assignmentIds = myWork.map((w) => w.assignmentId)
      const myAssignments = await db.query.assignments.findMany({
        where: assignmentIds.length > 0 
          ? sql`${assignments.id} IN (${sql.join(assignmentIds.map(id => sql`${id}`), sql`, `)})`
          : undefined,
      })

      const stats = {
        total: myAssignments.length,
        inProgress: myAssignments.filter((a) => ["assigned", "in_progress"].includes(a.status)).length,
        submitted: myAssignments.filter((a) => a.status === "submitted").length,
        completed: myAssignments.filter((a) => ["completed", "paid"].includes(a.status)).length,
        totalEarnings: myAssignments
          .filter((a) => a.status === "paid")
          .reduce((sum, a) => sum + (parseFloat(a.price || "0") || 0), 0),
      }

      return stats
    }

    return null
  }),

  getAdminStats: adminProcedure.query(async () => {
    const allAssignments = await db.query.assignments.findMany()
    const allUsers = await db.query.users.findMany()

    const stats = {
      totalAssignments: allAssignments.length,
      totalStudents: allUsers.filter((u) => u.role === "student").length,
      totalFreelancers: allUsers.filter((u) => u.role === "freelancer").length,
      pendingReview: allAssignments.filter((a) => a.status === "submitted").length,
      completedThisMonth: allAssignments.filter((a) => {
        const completedDate = a.updatedAt
        const now = new Date()
        return (
          a.status === "completed" &&
          completedDate.getMonth() === now.getMonth() &&
          completedDate.getFullYear() === now.getFullYear()
        )
      }).length,
      statusBreakdown: {
        draft: allAssignments.filter((a) => a.status === "draft").length,
        posted: allAssignments.filter((a) => a.status === "posted").length,
        assigned: allAssignments.filter((a) => a.status === "assigned").length,
        inProgress: allAssignments.filter((a) => a.status === "in_progress").length,
        submitted: allAssignments.filter((a) => a.status === "submitted").length,
        completed: allAssignments.filter((a) => a.status === "completed").length,
        paid: allAssignments.filter((a) => a.status === "paid").length,
      },
    }

    return stats
  }),
})
