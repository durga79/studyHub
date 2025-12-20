import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(["student", "freelancer"]),
  referralCode: z.string().optional(),
})

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName, role, referralCode } = registerSchema.parse(body)

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    let referredById: string | null = null
    if (referralCode) {
      const referrer = await db.query.users.findFirst({
        where: eq(users.referralCode, referralCode),
      })
      if (referrer) {
        referredById = referrer.id
      }
    }

    const hashedPassword = await hash(password, 12)
    const newReferralCode = generateReferralCode()

    const [user] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role,
        referralCode: newReferralCode,
        referredBy: referredById,
        isApproved: role === "student",
      })
      .returning()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    )
  }
}


