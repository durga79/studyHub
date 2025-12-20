"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Bot,
  Users,
  Settings,
  LogOut,
  PlusCircle,
  Search,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react"

const studentNavItems = [
  { href: "/dashboard/student", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/student/assignments", label: "My Assignments", icon: FileText },
  { href: "/dashboard/student/create", label: "Create Assignment", icon: PlusCircle },
  { href: "/dashboard/student/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/student/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/student/marketplace", label: "Marketplace", icon: ShoppingBag },
  { href: "/dashboard/student/ai-chat", label: "AI Assistant", icon: Sparkles },
  { href: "/dashboard/student/referrals", label: "Referrals", icon: Users },
]

const freelancerNavItems = [
  { href: "/dashboard/freelancer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/freelancer/browse", label: "Find Work", icon: Search },
  { href: "/dashboard/freelancer/my-assignments", label: "Active Jobs", icon: Briefcase },
  { href: "/dashboard/freelancer/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/freelancer/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/freelancer/marketplace", label: "My Projects", icon: ShoppingBag },
]

const adminNavItems = [
  { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/admin/assignments", label: "Assignments", icon: FileText },
  { href: "/dashboard/admin/payments", label: "Payments", icon: FileText },
  { href: "/dashboard/admin/freelancers", label: "Freelancers", icon: Users },
  { href: "/dashboard/admin/referrals", label: "Referrals", icon: Users },
  { href: "/dashboard/admin/ai-chat", label: "AI Chat", icon: Bot },
]

const superAdminNavItems = [
  { href: "/dashboard/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/super-admin/users", label: "Users", icon: Users },
  { href: "/dashboard/super-admin/settings", label: "Settings", icon: Settings },
]

interface SidebarProps {
  userRole: string
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  let navItems: typeof studentNavItems = []
  let roleLabel = ""
  let RoleIcon = GraduationCap
  
  if (userRole === "student") {
    navItems = studentNavItems
    roleLabel = "Student"
    RoleIcon = GraduationCap
  } else if (userRole === "freelancer") {
    navItems = freelancerNavItems
    roleLabel = "Expert"
    RoleIcon = Briefcase
  } else if (userRole === "admin") {
    navItems = adminNavItems
    roleLabel = "Admin"
    RoleIcon = Settings
  } else if (userRole === "super_admin") {
    navItems = superAdminNavItems
    roleLabel = "Super Admin"
    RoleIcon = Settings
  }

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
      <div className="flex flex-col flex-grow bg-gradient-to-b from-slate-900 via-slate-900 to-violet-950 overflow-y-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="h-10 w-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-violet-500/30">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">StudyHub</h1>
            <p className="text-xs text-slate-400">Learn • Connect • Grow</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <RoleIcon className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-medium text-white">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-white")} />
                {item.label}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-white animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-slate-400 rounded-xl hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>

        {/* Decorative gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-violet-600/10 to-transparent pointer-events-none" />
      </div>
    </aside>
  )
}
