import { router, protectedProcedure } from "../trpc"
import { z } from "zod"
import { messages, messageFiles, users, notifications } from "../../db/schema"
import { eq, and, or, desc, ne, sql } from "drizzle-orm"
import { db } from "../../db"

export const chatRouter = router({
  send: protectedProcedure
    .input(
      z.object({
        receiverId: z.string(),
        content: z.string().max(5000),
        assignmentId: z.string().optional(),
        projectId: z.string().optional(),
        files: z.array(z.object({
          fileName: z.string(),
          fileUrl: z.string(),
          fileSize: z.number(),
          fileType: z.string(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sender = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!sender) throw new Error("User not found")

      const receiver = await db.query.users.findFirst({
        where: eq(users.id, input.receiverId),
      })

      if (!receiver) throw new Error("Receiver not found")

      const [message] = await db
        .insert(messages)
        .values({
          senderId: sender.id,
          receiverId: receiver.id,
          content: input.content || "",
          assignmentId: input.assignmentId,
          projectId: input.projectId,
        })
        .returning()

      // Add files if provided
      if (input.files && input.files.length > 0) {
        await db.insert(messageFiles).values(
          input.files.map(file => ({
            messageId: message.id,
            fileName: file.fileName,
            fileUrl: file.fileUrl,
            fileSize: file.fileSize,
            fileType: file.fileType,
            isVideo: file.fileType.startsWith("video/"),
          }))
        )
      }

      await db.insert(notifications).values({
        userId: receiver.id,
        title: "New Message",
        message: `${sender.firstName || "Someone"} sent you a message`,
        type: "message",
        link: `/dashboard/${receiver.role}/messages`,
      })

      return message
    }),

  addFile: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number(),
        fileType: z.string(),
        isVideo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [file] = await db
        .insert(messageFiles)
        .values({
          messageId: input.messageId,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          fileType: input.fileType,
          isVideo: input.isVideo ?? false,
        })
        .returning()

      return file
    }),

  getConversationList: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!currentUser) throw new Error("User not found")

    const allMessages = await db.query.messages.findMany({
      where: or(
        eq(messages.senderId, currentUser.id),
        eq(messages.receiverId, currentUser.id)
      ),
      orderBy: desc(messages.createdAt),
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        receiver: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    const conversationsMap = new Map<
      string,
      {
        otherUser: {
          id: string
          firstName: string | null
          lastName: string | null
          email: string
        }
        lastMessage: {
          content: string
          createdAt: Date
          isRead: boolean | null
        }
        unreadCount: number
        assignmentId?: string | null
      }
    >()

    for (const msg of allMessages) {
      const sender = msg.sender as { id: string; firstName: string | null; lastName: string | null; email: string }
      const receiver = msg.receiver as { id: string; firstName: string | null; lastName: string | null; email: string }
      const otherUser = msg.senderId === currentUser.id ? receiver : sender
      const conversationKey = otherUser.id

      if (!conversationsMap.has(conversationKey)) {
        const unreadCount = allMessages.filter(
          (m) =>
            m.senderId === otherUser.id &&
            m.receiverId === currentUser.id &&
            !m.isRead
        ).length

        conversationsMap.set(conversationKey, {
          otherUser,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
          },
          unreadCount,
          assignmentId: msg.assignmentId,
        })
      }
    }

    return Array.from(conversationsMap.values())
  }),

  getConversation: protectedProcedure
    .input(
      z.object({
        otherUserId: z.string(),
        assignmentId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!currentUser) throw new Error("User not found")

      const conditions = [
        or(
          and(
            eq(messages.senderId, currentUser.id),
            eq(messages.receiverId, input.otherUserId)
          )!,
          and(
            eq(messages.senderId, input.otherUserId),
            eq(messages.receiverId, currentUser.id)
          )!
        )!,
      ]

      if (input.assignmentId) {
        conditions.push(eq(messages.assignmentId, input.assignmentId))
      }

      const conversation = await db.query.messages.findMany({
        where: and(...conditions),
        orderBy: desc(messages.createdAt),
        limit: 100,
        with: {
          sender: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          receiver: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          files: true,
        },
      })

      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.senderId, input.otherUserId),
            eq(messages.receiverId, currentUser.id),
            eq(messages.isRead, false)
          )
        )

      return conversation.reverse()
    }),

  markAsRead: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!currentUser) throw new Error("User not found")

      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.id, input.messageId),
            eq(messages.receiverId, currentUser.id)
          )
        )

      return { success: true }
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!currentUser) throw new Error("User not found")

    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.receiverId, currentUser.id),
        eq(messages.isRead, false)
      ),
    })

    return unreadMessages.length
  }),
})
