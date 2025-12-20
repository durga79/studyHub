import { router } from "./trpc"
import { assignmentsRouter } from "./routers/assignments"
import { chatRouter } from "./routers/chat"
import { paymentsRouter } from "./routers/payments"
import { marketplaceRouter } from "./routers/marketplace"
import { calendarRouter } from "./routers/calendar"
import { aiRouter } from "./routers/ai"
import { referralsRouter } from "./routers/referrals"
import { usersRouter } from "./routers/users"
import { notificationsRouter } from "./routers/notifications"

export const appRouter = router({
  assignments: assignmentsRouter,
  chat: chatRouter,
  payments: paymentsRouter,
  marketplace: marketplaceRouter,
  calendar: calendarRouter,
  ai: aiRouter,
  referrals: referralsRouter,
  users: usersRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter

