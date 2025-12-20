import { router, protectedProcedure, adminProcedure } from "../trpc"
import { z } from "zod"
import { referrals, users, assignments } from "../../db/schema"
import { eq, and } from "drizzle-orm"
import { db } from "../../db"
import { REFERRAL_REWARD } from "@/lib/constants"

export const referralsRouter = router({
  getReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    if (user.role !== "student") {
      throw new Error("Only students can have referral codes")
    }

    if (!user.referralCode) {
      const referralCode = `REF-${user.id.slice(0, 8).toUpperCase()}`
      await db
        .update(users)
        .set({ referralCode })
        .where(eq(users.id, user.id))
      return referralCode
    }

    return user.referralCode
  }),

  verify: adminProcedure
    .input(
      z.object({
        referralId: z.string(),
        isVerified: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const admin = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId!),
      })

      if (!admin) throw new Error("User not found")

      const referral = await db.query.referrals.findFirst({
        where: eq(referrals.id, input.referralId),
        with: {
          assignment: true,
        },
      })

      if (!referral) throw new Error("Referral not found")

      const referralAssignment = referral.assignment as { status: string } | null
      if (referralAssignment?.status !== "paid") {
        throw new Error("Assignment must be completed and paid before verifying referral")
      }

      const [updated] = await db
        .update(referrals)
        .set({
          isVerified: input.isVerified,
          verifiedBy: admin.id,
          verifiedAt: new Date(),
          rewardAmount: input.isVerified ? REFERRAL_REWARD.toString() : null,
        })
        .where(eq(referrals.id, input.referralId))
        .returning()

      return updated
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId!),
    })

    if (!user) throw new Error("User not found")

    const userReferrals = await db.query.referrals.findMany({
      where: eq(referrals.referrerId, user.id),
      with: {
        referred: true,
        assignment: true,
      },
    })

    return userReferrals
  }),
})

