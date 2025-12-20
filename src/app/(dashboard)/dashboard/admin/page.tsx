"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Users, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  UserCheck,
  UserX,
  AlertCircle
} from "lucide-react"

export default function AdminDashboard() {
  const { data: userStats } = trpc.users.getStats.useQuery()
  const { data: assignmentStats } = trpc.assignments.getAdminStats.useQuery()
  const { data: paymentStats } = trpc.payments.getStats.useQuery()

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of platform activity and metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{userStats?.newThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentStats?.totalAssignments || 0}</div>
            <p className="text-xs text-muted-foreground">
              {assignmentStats?.completedThisMonth || 0} completed this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${paymentStats?.totalAmount?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground">
              ${paymentStats?.thisMonthAmount?.toFixed(2) || "0.00"} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignmentStats?.pendingReview || 0}</div>
            <p className="text-xs text-muted-foreground">
              Submissions awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Students</span>
              <span className="font-bold">{userStats?.students || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Freelancers</span>
              <span className="font-bold">{userStats?.freelancers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Admins</span>
              <span className="font-bold">{userStats?.admins || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Freelancer Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Approved</span>
              </div>
              <span className="font-bold text-green-600">{userStats?.approvedFreelancers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-yellow-600" />
                <span className="text-muted-foreground">Pending Approval</span>
              </div>
              <span className="font-bold text-yellow-600">{userStats?.pendingFreelancers || 0}</span>
            </div>
            <Link href="/dashboard/admin/freelancers">
              <Button variant="outline" className="w-full mt-2">
                Manage Freelancers
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Draft</span>
              <span>{assignmentStats?.statusBreakdown?.draft || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Posted</span>
              <span>{assignmentStats?.statusBreakdown?.posted || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">In Progress</span>
              <span>{assignmentStats?.statusBreakdown?.inProgress || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Submitted</span>
              <span>{assignmentStats?.statusBreakdown?.submitted || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Completed</span>
              <span>{assignmentStats?.statusBreakdown?.completed || 0}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-green-600">{assignmentStats?.statusBreakdown?.paid || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-muted-foreground">Pending Verification</span>
              </div>
              <span className="font-bold">{paymentStats?.pending || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-muted-foreground">Verified</span>
              </div>
              <span className="font-bold">{paymentStats?.verified || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-muted-foreground">Rejected</span>
              </div>
              <span className="font-bold">{paymentStats?.rejected || 0}</span>
            </div>
            <Link href="/dashboard/admin/payments">
              <Button className="w-full mt-2">
                Review Payments
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/admin/payments">
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                Verify Payments ({paymentStats?.pending || 0} pending)
              </Button>
            </Link>
            <Link href="/dashboard/admin/freelancers">
              <Button variant="outline" className="w-full justify-start">
                <UserCheck className="mr-2 h-4 w-4" />
                Approve Freelancers ({userStats?.pendingFreelancers || 0} pending)
              </Button>
            </Link>
            <Link href="/dashboard/admin/referrals">
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Verify Referrals
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
