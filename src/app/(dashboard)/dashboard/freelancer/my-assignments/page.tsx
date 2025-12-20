"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { FileText, Clock, CheckCircle, DollarSign, AlertCircle } from "lucide-react"

interface WorkItem {
  id: string
  submittedAt: Date | null
  assignment: {
    id: string
    title: string
    description: string
    category: string
    status: string
    deadline: Date
    price: string | null
    student?: {
      firstName: string | null
      lastName: string | null
    }
  }
}

export default function MyAssignmentsPage() {
  const { data: myWork, isLoading } = trpc.assignments.getMyAssignedWork.useQuery()

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading assignments...</p>
      </div>
    )
  }

  const workItems = (myWork || []) as unknown as WorkItem[]

  const inProgress = workItems.filter(
    (w) => ["assigned", "in_progress"].includes(w.assignment?.status)
  )

  const submitted = workItems.filter(
    (w) => w.assignment?.status === "submitted"
  )

  const completed = workItems.filter(
    (w) => ["completed", "paid"].includes(w.assignment?.status)
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "assigned":
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "submitted":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "paid":
        return <DollarSign className="h-4 w-4 text-green-600" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
      case "in_progress":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "submitted":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "completed":
      case "paid":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return ""
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Assignments</h1>
        <p className="text-muted-foreground mt-1">
          Manage your accepted assignments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{inProgress.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{submitted.length}</p>
                <p className="text-sm text-muted-foreground">Under Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{completed.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {workItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No assigned assignments yet</p>
            <Link href="/dashboard/freelancer/browse">
              <Button>Browse Assignments</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {inProgress.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  In Progress
                </CardTitle>
                <CardDescription>Assignments you are currently working on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgress.map((work) => (
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
                          <p className="text-xs text-muted-foreground mt-1">
                            Student: {work.assignment.student?.firstName} {work.assignment.student?.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          {work.assignment.price && (
                            <span className="font-bold text-green-600">
                              ${work.assignment.price}
                            </span>
                          )}
                          <Badge variant="outline" className={getStatusColor(work.assignment.status)}>
                            {getStatusIcon(work.assignment.status)}
                            <span className="ml-1">{work.assignment.status.replace("_", " ")}</span>
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {submitted.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Under Review
                </CardTitle>
                <CardDescription>Waiting for student approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submitted.map((work) => (
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
                              Submitted: {work.submittedAt ? formatDate(work.submittedAt) : "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {work.assignment.price && (
                            <span className="font-bold text-green-600">
                              ${work.assignment.price}
                            </span>
                          )}
                          <Badge variant="outline" className={getStatusColor(work.assignment.status)}>
                            Under Review
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Completed
                </CardTitle>
                <CardDescription>Successfully completed assignments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completed.map((work) => (
                    <Link
                      key={work.id}
                      href={`/dashboard/freelancer/assignments/${work.assignment.id}`}
                    >
                      <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <p className="font-medium">{work.assignment.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{work.assignment.category}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {work.assignment.price && (
                            <span className="font-bold text-green-600">
                              ${work.assignment.price}
                            </span>
                          )}
                          <Badge variant="outline" className={getStatusColor(work.assignment.status)}>
                            {work.assignment.status === "paid" ? "Paid" : "Completed"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
