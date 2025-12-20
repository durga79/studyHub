export const USER_ROLES = {
  STUDENT: "student",
  FREELANCER: "freelancer",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const ASSIGNMENT_STATUS = {
  DRAFT: "draft",
  POSTED: "posted",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  COMPLETED: "completed",
  PAID: "paid",
} as const

export type AssignmentStatus =
  (typeof ASSIGNMENT_STATUS)[keyof typeof ASSIGNMENT_STATUS]

export const ASSIGNMENT_CATEGORIES = [
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
] as const

export type AssignmentCategory =
  (typeof ASSIGNMENT_CATEGORIES)[number]

export const PAYMENT_STATUS = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

export const REFERRAL_REWARD = 15

export const FILE_SIZE_LIMITS = {
  ASSIGNMENT_FILE: 25 * 1024 * 1024,
  ASSIGNMENT_TOTAL: 100 * 1024 * 1024,
  VIDEO_MESSAGE: Infinity,
} as const

export const ALLOWED_FILE_TYPES = {
  ASSIGNMENT: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "application/zip",
    "application/x-zip-compressed",
  ],
  CODE: [
    "text/plain",
    "text/javascript",
    "text/typescript",
    "text/python",
    "text/java",
    "text/x-c",
    "text/x-c++",
    "application/json",
  ],
  IMAGE: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  VIDEO: ["video/mp4", "video/webm", "video/quicktime"],
} as const

