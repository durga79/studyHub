import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/server/db"
import { users } from "@/server/db/schema"
import { eq } from "drizzle-orm"
import { Sidebar } from "@/components/shared/sidebar"
import { BottomNav } from "@/components/shared/bottom-nav"
import { DashboardClientWrapper } from "@/components/shared/dashboard-client-wrapper"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      <Sidebar userRole={user.role} />
      <main className="flex-1 md:ml-72 pb-16 md:pb-0">
        <DashboardClientWrapper userRole={user.role}>
          {children}
        </DashboardClientWrapper>
      </main>
      <BottomNav userRole={user.role} />
    </div>
  )
}
