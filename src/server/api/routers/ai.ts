import { router, protectedProcedure } from "../trpc"
import { z } from "zod"
import { aiConversations, aiMessages, users, assignments } from "../../db/schema"
import { eq, and, desc } from "drizzle-orm"
import { db } from "../../db"
import { generateAIResponseWithHistory } from "../../ai/gemini"
import { aiMessageSchema } from "@/lib/validations"

export const aiRouter = router({
  sendMessage: protectedProcedure
    .input(aiMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!user) throw new Error("User not found")

      if (user.role !== "student" && user.role !== "admin" && user.role !== "super_admin") {
        throw new Error("AI chat is only available to students and admins")
      }

      let conversation = input.conversationId
        ? await db.query.aiConversations.findFirst({
            where: eq(aiConversations.id, input.conversationId),
          })
        : null

      if (!conversation) {
        const [newConversation] = await db
          .insert(aiConversations)
          .values({
            userId: user.id,
            assignmentId: input.assignmentId,
          })
          .returning()

        conversation = newConversation
      }

      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        role: "user",
        content: input.content,
      })

      const history = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conversation.id))
        .orderBy(desc(aiMessages.createdAt))
        .limit(10)

      let context: string | undefined
      if (input.assignmentId) {
        const assignment = await db.query.assignments.findFirst({
          where: eq(assignments.id, input.assignmentId),
        })
        if (assignment) {
          context = `Assignment: ${assignment.title}\nDescription: ${assignment.description}\nCategory: ${assignment.category}\nDeadline: ${assignment.deadline}`
        }
      }

      let aiResponse: string
      try {
        aiResponse = await generateAIResponseWithHistory(
          input.content,
          history.reverse().map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          context
        )
      } catch (error) {
        aiResponse = "I'm having trouble generating a response right now. Please try again later."
      }

      await db.insert(aiMessages).values({
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
      })

      return {
        conversationId: conversation.id,
        response: aiResponse,
      }
    }),

  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

      const conversations = await db
        .select()
        .from(aiConversations)
        .where(eq(aiConversations.userId, user.id))
        .orderBy(desc(aiConversations.updatedAt))

    return conversations
  }),

  getConversation: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await db.query.aiConversations.findFirst({
        where: eq(aiConversations.id, input.conversationId),
      })

      const messages = await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, input.conversationId))
        .orderBy(desc(aiMessages.createdAt))

      return {
        ...conversation,
        messages: messages.reverse(),
      }

    }),
})

