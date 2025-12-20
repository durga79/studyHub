"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  ShoppingBag,
  Search,
  Briefcase,
} from "lucide-react"

const studentNavItems = [
  { href: "/dashboard/student", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/student/assignments", label: "Tasks", icon: FileText },
  { href: "/dashboard/student/messages", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/student/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/student/marketplace", label: "Shop", icon: ShoppingBag },
]

const freelancerNavItems = [
  { href: "/dashboard/freelancer", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/freelancer/browse", label: "Find", icon: Search },
  { href: "/dashboard/freelancer/my-assignments", label: "Jobs", icon: Briefcase },
  { href: "/dashboard/freelancer/messages", label: "Chat", icon: MessageSquare },
  { href: "/dashboard/freelancer/marketplace", label: "Projects", icon: ShoppingBag },
]

interface BottomNavProps {
  userRole: string
}

export function BottomNav({ userRole }: BottomNavProps) {
  const pathname = usePathname()

  let navItems: typeof studentNavItems = []
  if (userRole === "student") {
    navItems = studentNavItems
  } else if (userRole === "freelancer") {
    navItems = freelancerNavItems
  } else {
    return null
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 transition-all duration-200",
                isActive
                  ? "text-violet-600"
                  : "text-slate-400"
              )}
            >
              <div className={cn(
                "relative p-1.5 rounded-xl transition-all",
                isActive && "bg-violet-100"
              )}>
                <Icon className={cn("h-5 w-5", isActive && "text-violet-600")} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-violet-600" />
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive ? "text-violet-600" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
