import { initTRPC, TRPCError } from "@trpc/server"
import { auth } from "@/lib/auth"
import { db } from "../db"
import { users } from "../db/schema"
import { eq } from "drizzle-orm"

interface Context {
  userId: string | null
  userRole: string | null
}

export async function createContext(): Promise<Context> {
  const session = await auth()

  let userId: string | null = null
  let userRole: string | null = null

  if (session?.user?.id) {
    userId = session.user.id
    userRole = session.user.role
  }

  return {
    userId,
    userRole,
  }
}

const t = initTRPC.context<Context>().create()

export const router = t.router
export const publicProcedure = t.procedure

export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts

  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    })
  }

  return opts.next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
    },
  })
})

export const studentProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (ctx.userRole !== "student") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This resource is only available to students",
    })
  }

  return opts.next({ ctx })
})

export const freelancerProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (ctx.userRole !== "freelancer") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This resource is only available to freelancers",
    })
  }

  return opts.next({ ctx })
})

export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (ctx.userRole !== "admin" && ctx.userRole !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This resource is only available to admins",
    })
  }

  return opts.next({ ctx })
})

export const superAdminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts

  if (ctx.userRole !== "super_admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This resource is only available to super admins",
    })
  }

  return opts.next({ ctx })
})
