import { z } from "zod"

export const assignmentSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
  category: z.enum([
    "Blockchain",
    "Cybersecurity",
    "Web Development",
    "Edge Computing",
    "Fog Computing",
    "Machine Learning",
    "Data Science",
    "Cloud Computing",
    "Mobile Development",
    "DevOps",
    "Other",
  ]),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
  deadline: z.coerce.date().refine((date) => date > new Date(), {
    message: "Deadline must be in the future",
  }),
  videoRequirements: z.string().max(1000).optional(),
  price: z.number().positive().optional(),
})

export const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  assignmentId: z.string().optional(),
  projectId: z.string().optional(),
})

export const paymentSchema = z.object({
  amount: z.number().positive(),
  upiId: z.string().min(1),
  assignmentId: z.string(),
  freelancerId: z.string(),
})

export const projectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  category: z.enum([
    "Blockchain",
    "Cybersecurity",
    "Web Development",
    "Edge Computing",
    "Fog Computing",
    "Machine Learning",
    "Data Science",
    "Cloud Computing",
    "Mobile Development",
    "DevOps",
    "Other",
  ]),
  price: z.number().positive(),
  tags: z.array(z.string().min(1).max(50)).max(10).optional(),
})

export const calendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  assignmentId: z.string().optional(),
})

export const aiMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  assignmentId: z.string().optional(),
  conversationId: z.string().optional(),
})

