"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { 
  FileText, 
  Search, 
  Clock, 
  CheckCircle, 
  DollarSign,
  MessageSquare,
  ShoppingBag,
  ArrowRight,
  AlertCircle
} from "lucide-react"

export default function FreelancerDashboard() {
  const { data: user } = trpc.users.getCurrent.useQuery()
  const { data: stats } = trpc.assignments.getStats.useQuery()
  const { data: marketplaceStats } = trpc.marketplace.getStats.useQuery()
  const { data: myWork } = trpc.assignments.getMyAssignedWork.useQuery()
  const { data: notifications } = trpc.notifications.list.useQuery({ unreadOnly: true })

  const recentWork = (myWork?.slice(0, 5) || []) as any[]

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.firstName || "Freelancer"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {user?.isApproved 
            ? "Here's an overview of your work" 
            : "Your account is pending approval"}
        </p>
      </div>

      {!user?.isApproved && (
        <Card className="mb-6 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-medium">Account Pending Approval</p>
                <p className="text-sm text-muted-foreground">
                  Your freelancer account is awaiting admin approval. You will be notified once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(stats as any)?.totalEarnings?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Assignments</CardTitle>
                <CardDescription>Assignments you are working on</CardDescription>
              </div>
              <Link href="/dashboard/freelancer/browse">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Browse More
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentWork.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No assignments yet</p>
                  <Link href="/dashboard/freelancer/browse">
                    <Button>Browse Available Assignments</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentWork.map((work) => (
                    <Link
                      key={work.id}
                      href={`/dashboard/freelancer/assignments/${work.assignment.id}`}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{work.assignment.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{work.assignment.category}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Due: {formatDate(work.assignment.deadline)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {work.assignment.status.replace("_", " ")}
                          </Badge>
                          {work.assignment.price && (
                            <span className="font-medium text-green-600">
                              ${work.assignment.price}
                            </span>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link href="/dashboard/freelancer/my-assignments">
                    <Button variant="outline" className="w-full">
                      View All My Assignments
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/dashboard/freelancer/browse">
                <Button variant="outline" className="w-full justify-start">
                  <Search className="mr-2 h-4 w-4" />
                  Browse Assignments
                </Button>
              </Link>
              <Link href="/dashboard/freelancer/my-assignments">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  My Assignments
                </Button>
              </Link>
              <Link href="/dashboard/freelancer/messages">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Messages
                </Button>
              </Link>
              <Link href="/dashboard/freelancer/marketplace">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  My Projects
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Marketplace Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Projects Listed</span>
                <span className="font-bold">{marketplaceStats?.totalProjects || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Sales</span>
                <span className="font-bold">{marketplaceStats?.totalSales || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Earnings</span>
                <span className="font-bold text-green-600">
                  ${marketplaceStats?.totalEarnings?.toFixed(2) || "0.00"}
                </span>
              </div>
            </CardContent>
          </Card>

          {notifications && notifications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifications.slice(0, 3).map((notification) => (
                    <div
                      key={notification.id}
                      className="p-2 bg-muted rounded-lg"
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">
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
