import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"

export default async function Home() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    redirect("/sign-in")
  }

  if (user.role === "student") {
    redirect("/dashboard/student")
  } else if (user.role === "freelancer") {
    redirect("/dashboard/freelancer")
  } else if (user.role === "admin") {
    redirect("/dashboard/admin")
  } else if (user.role === "super_admin") {
    redirect("/dashboard/super-admin")
  }

  redirect("/sign-in")
}
