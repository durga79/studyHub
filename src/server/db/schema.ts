import {
  pgTable,
  text,
  timestamp,
  boolean,
  decimal,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"

export const userRoleEnum = pgEnum("UserRole", [
  "student",
  "freelancer",
  "admin",
  "super_admin",
  "owner",
  "member",
  "contractor",
])

export const assignmentStatusEnum = pgEnum("AssignmentStatus", [
  "draft",
  "posted",
  "assigned",
  "in_progress",
  "submitted",
  "under_review",
  "completed",
  "paid",
  "open",
  "claimed",
  "deliverable_uploaded",
  "awaiting_payment",
  "released",
  "closed",
  "disputed",
])

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: userRoleEnum("role").notNull().default("student"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  isEmailVerified: boolean("is_email_verified").default(false),
  isApproved: boolean("is_approved").default(false),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const usersRelations = relations(users, ({ many }) => ({
  assignments: many(assignments),
  freelancerAssignments: many(assignmentsFreelancers),
  messages: many(messages),
  payments: many(payments),
  projects: many(projects),
  calendarEvents: many(calendarEvents),
  referralsGiven: many(referrals),
  aiConversations: many(aiConversations),
}))

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const assignments = pgTable("assignments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  tags: text("tags").array(),
  status: assignmentStatusEnum("status").notNull().default("draft"),
  deadline: timestamp("deadline"),
  price: decimal("price", { precision: 10, scale: 2 }),
  videoRequirements: text("video_requirements"),
  freelancerId: text("freelancer_id"),
  submissionNotes: text("submission_notes"),
  submittedAt: timestamp("submitted_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  student: one(users, {
    fields: [assignments.studentId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [assignments.freelancerId],
    references: [users.id],
  }),
  files: many(assignmentFiles),
  freelancers: many(assignmentsFreelancers),
  messages: many(messages),
  payments: many(payments),
  calendarEvents: many(calendarEvents),
}))

export const assignmentFiles = pgTable("assignment_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignment_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const assignmentFilesRelations = relations(
  assignmentFiles,
  ({ one }) => ({
    assignment: one(assignments, {
      fields: [assignmentFiles.assignmentId],
      references: [assignments.id],
    }),
  })
)

export const assignmentsFreelancers = pgTable("assignments_freelancers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignment_id").notNull(),
  freelancerId: text("freelancer_id").notNull(),
  acceptedAt: timestamp("accepted_at"),
  startedAt: timestamp("started_at"),
  submittedAt: timestamp("submitted_at"),
  submissionNotes: text("submission_notes"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const assignmentsFreelancersRelations = relations(
  assignmentsFreelancers,
  ({ one }) => ({
    assignment: one(assignments, {
      fields: [assignmentsFreelancers.assignmentId],
      references: [assignments.id],
    }),
    freelancer: one(users, {
      fields: [assignmentsFreelancers.freelancerId],
      references: [users.id],
    }),
  })
)

export const projects = pgTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  freelancerId: text("freelancer_id").notNull(),
  assignmentId: text("assignment_id"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const projectsRelations = relations(projects, ({ one, many }) => ({
  freelancer: one(users, {
    fields: [projects.freelancerId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [projects.assignmentId],
    references: [assignments.id],
  }),
  files: many(projectFiles),
  purchases: many(projectPurchases),
}))

export const projectFiles = pgTable("project_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
})

export const projectFilesRelations = relations(projectFiles, ({ one }) => ({
  project: one(projects, {
    fields: [projectFiles.projectId],
    references: [projects.id],
  }),
}))

export const projectPurchases = pgTable("project_purchases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text("project_id").notNull(),
  studentId: text("student_id").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  purchasedAt: timestamp("purchased_at").defaultNow().notNull(),
})

export const projectPurchasesRelations = relations(
  projectPurchases,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectPurchases.projectId],
      references: [projects.id],
    }),
    student: one(users, {
      fields: [projectPurchases.studentId],
      references: [users.id],
    }),
  })
)

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  assignmentId: text("assignment_id"),
  projectId: text("project_id"),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [messages.assignmentId],
    references: [assignments.id],
  }),
  project: one(projects, {
    fields: [messages.projectId],
    references: [projects.id],
  }),
  files: many(messageFiles),
}))

export const messageFiles = pgTable("message_files", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  messageId: text("message_id").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),
  fileType: text("file_type"),
  isVideo: boolean("is_video").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
})

export const messageFilesRelations = relations(messageFiles, ({ one }) => ({
  message: one(messages, {
    fields: [messageFiles.messageId],
    references: [messages.id],
  }),
}))

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  assignmentId: text("assignment_id").notNull(),
  studentId: text("student_id").notNull(),
  freelancerId: text("freelancer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  upiId: text("upi_id"),
  status: text("status").default("pending"),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  assignment: one(assignments, {
    fields: [payments.assignmentId],
    references: [assignments.id],
  }),
  student: one(users, {
    fields: [payments.studentId],
    references: [users.id],
  }),
  freelancer: one(users, {
    fields: [payments.freelancerId],
    references: [users.id],
  }),
  screenshots: many(paymentScreenshots),
}))

export const paymentScreenshots = pgTable("payment_screenshots", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  paymentId: text("payment_id").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
})

export const paymentScreenshotsRelations = relations(
  paymentScreenshots,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentScreenshots.paymentId],
      references: [payments.id],
    }),
  })
)

export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  assignmentId: text("assignment_id"),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [calendarEvents.assignmentId],
    references: [assignments.id],
  }),
}))

export const referrals = pgTable("referrals", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  referrerId: text("referrer_id").notNull(),
  referredId: text("referred_id").notNull(),
  assignmentId: text("assignment_id"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }),
  isVerified: boolean("is_verified").default(false),
  verifiedBy: text("verified_by"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
  }),
  assignment: one(assignments, {
    fields: [referrals.assignmentId],
    references: [assignments.id],
  }),
}))

export const aiConversations = pgTable("ai_conversations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  assignmentId: text("assignment_id"),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const aiConversationsRelations = relations(
  aiConversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [aiConversations.userId],
      references: [users.id],
    }),
    assignment: one(assignments, {
      fields: [aiConversations.assignmentId],
      references: [assignments.id],
    }),
    messages: many(aiMessages),
  })
)

export const aiMessages = pgTable("ai_messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}))

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type"),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}))
