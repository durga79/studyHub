"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  UserCheck,
  Settings
} from "lucide-react"

export default function SuperAdminDashboard() {
  const { data: stats, isLoading } = trpc.users.getStats.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and management</p>
        </div>
        <Badge variant="destructive" className="text-sm py-1 px-3">
          Super Admin
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.newThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.students || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active learners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freelancers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.freelancers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.approvedFreelancers || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingFreelancers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Freelancers waiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/super-admin/users">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>
                View, edit, and manage all platform users. Approve freelancers and change roles.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/super-admin/settings">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle>Platform Settings</CardTitle>
              </div>
              <CardDescription>
                Configure platform-wide settings, payment options, and notifications.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/admin/assignments">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>All Assignments</CardTitle>
              </div>
              <CardDescription>
                View and manage all assignments across the platform.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* Admin Team */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Team</CardTitle>
          <CardDescription>Platform administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                SA
              </div>
              <div>
                <p className="text-sm font-medium">Super Admins</p>
                <p className="text-xs text-muted-foreground">{stats?.superAdmins || 0} users</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-sm font-medium">
                A
              </div>
              <div>
                <p className="text-sm font-medium">Admins</p>
                <p className="text-xs text-muted-foreground">{stats?.admins || 0} users</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
