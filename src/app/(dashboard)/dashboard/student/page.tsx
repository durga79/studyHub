"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  DollarSign,
  MessageSquare,
  Sparkles,
  Users,
  ArrowRight,
  Zap,
  Target,
  Gift
} from "lucide-react"

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  posted: "bg-violet-100 text-violet-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
}

export default function StudentDashboard() {
  const { data: user } = trpc.users.getCurrent.useQuery()
  const { data: stats } = trpc.assignments.getStats.useQuery()
  const { data: assignments } = trpc.assignments.list.useQuery({
    myAssignments: true,
  })
  const { data: notifications } = trpc.notifications.list.useQuery({ unreadOnly: true })

  const recentAssignments = assignments?.slice(0, 4) || []
  const greeting = getGreeting()

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl gradient-bg p-8 md:p-10 text-white">
        <div className="relative z-10">
          <p className="text-violet-200 text-sm font-medium mb-2">{greeting}</p>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome back, {user?.firstName || "Student"}! 👋
          </h1>
          <p className="text-violet-100 max-w-xl mb-6">
            Ready to tackle your assignments? Track your progress, connect with experts, and achieve your academic goals.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/student/create">
              <Button className="bg-white text-violet-700 hover:bg-violet-50 shadow-lg">
                <Plus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </Link>
            <Link href="/dashboard/student/ai-chat">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-cyan-400/20 rounded-full blur-2xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.total || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-amber-600">{stats?.inProgress || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-emerald-600">{stats?.completed || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-cyan-600">
                  {stats?.total ? Math.round(((stats?.completed || 0) / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-cyan-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900">Recent Assignments</CardTitle>
                <CardDescription>Your latest projects and their status</CardDescription>
              </div>
              <Link href="/dashboard/student/assignments">
                <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentAssignments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-violet-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">No assignments yet</h3>
                  <p className="text-slate-500 mb-4 text-sm">Start your academic journey today</p>
                  <Link href="/dashboard/student/create">
                    <Button className="gradient-bg shadow-lg shadow-violet-500/25">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Assignment
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAssignments.map((assignment) => (
                    <Link
                      key={assignment.id}
                      href={`/dashboard/student/assignments/${assignment.id}`}
                      className="block"
                    >
                      <div className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/50 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-slate-100 group-hover:bg-violet-100 flex items-center justify-center transition-colors">
                            <FileText className="h-5 w-5 text-slate-600 group-hover:text-violet-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{assignment.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-500">{assignment.category}</span>
                              <span className="text-slate-300">•</span>
                              <span className="text-xs text-slate-500">
                                Due {assignment.deadline ? formatDate(assignment.deadline) : "No deadline"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={statusColors[assignment.status] || "bg-slate-100 text-slate-700"}>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Referrals */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/student/create" className="block">
                <Button variant="ghost" className="w-full justify-start h-12 hover:bg-violet-50 hover:text-violet-700">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center mr-3">
                    <Plus className="h-4 w-4 text-violet-600" />
                  </div>
                  Create Assignment
                </Button>
              </Link>
              <Link href="/dashboard/student/marketplace" className="block">
                <Button variant="ghost" className="w-full justify-start h-12 hover:bg-cyan-50 hover:text-cyan-700">
                  <div className="h-8 w-8 rounded-lg bg-cyan-100 flex items-center justify-center mr-3">
                    <Target className="h-4 w-4 text-cyan-600" />
                  </div>
                  Browse Projects
                </Button>
              </Link>
              <Link href="/dashboard/student/messages" className="block">
                <Button variant="ghost" className="w-full justify-start h-12 hover:bg-emerald-50 hover:text-emerald-700">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center mr-3">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                  </div>
                  Messages
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Referral Card */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-violet-600 to-cyan-500 p-6 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Gift className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">Referral Program</h3>
              </div>
              <p className="text-violet-100 text-sm mb-4">
                Invite friends and earn ₹500 for each successful referral!
              </p>
              <Link href="/dashboard/student/referrals">
                <Button className="w-full bg-white text-violet-700 hover:bg-violet-50">
                  <Users className="mr-2 h-4 w-4" />
                  Get Referral Link
                </Button>
              </Link>
            </div>
          </Card>

          {/* Notifications */}
          {notifications && notifications.length > 0 && (
            <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Notifications
                  <Badge className="ml-2 bg-violet-100 text-violet-700">{notifications.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="p-3 bg-slate-50 rounded-xl"
                    >
                      <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {notification.message}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}
