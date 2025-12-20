"use client"

import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { Plus, FileText, Clock, DollarSign, ArrowRight, Sparkles } from "lucide-react"

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  posted: "bg-violet-100 text-violet-700 border-violet-200",
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  submitted: "bg-cyan-100 text-cyan-700 border-cyan-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  paid: "bg-green-100 text-green-700 border-green-200",
}

export default function StudentAssignmentsPage() {
  const { data: assignments, isLoading } = trpc.assignments.list.useQuery({
    myAssignments: true,
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading your assignments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
            My Assignments
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage all your academic projects
          </p>
        </div>
        <Link href="/dashboard/student/create">
          <Button className="gradient-bg hover:opacity-90 shadow-lg shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5">
            <Plus className="mr-2 h-4 w-4" />
            New Assignment
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{assignments?.length || 0}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments?.filter(a => a.status === "in_progress").length || 0}
                </p>
                <p className="text-xs text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {assignments?.filter(a => a.status === "completed").length || 0}
                </p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ${assignments?.reduce((sum, a) => sum + (parseFloat(a.price || "0")), 0).toFixed(0) || 0}
                </p>
                <p className="text-xs text-slate-500">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignments Grid */}
      {!assignments || assignments.length === 0 ? (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-100 to-cyan-100 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-violet-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No assignments yet</h3>
            <p className="text-slate-500 mb-6 text-center max-w-sm">
              Create your first assignment and get help from expert freelancers
            </p>
            <Link href="/dashboard/student/create">
              <Button className="gradient-bg hover:opacity-90 shadow-lg shadow-violet-500/25">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Assignment
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card 
              key={assignment.id} 
              className="group border-0 shadow-sm hover:shadow-xl bg-white/80 backdrop-blur transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
                    {assignment.title}
                  </CardTitle>
                  <Badge 
                    className={`${statusColors[assignment.status] || statusColors.draft} border text-xs font-medium`}
                  >
                    {assignment.status.replace("_", " ")}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-violet-600 font-medium">
                  {assignment.category}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500 line-clamp-2">
                  {assignment.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="h-4 w-4" />
                    <span>{assignment.deadline ? formatDate(assignment.deadline) : "No deadline"}</span>
                  </div>
                  {assignment.price && (
                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>{assignment.price}</span>
                    </div>
                  )}
                </div>

                <Link href={`/dashboard/student/assignments/${assignment.id}`}>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group-hover:bg-violet-50 group-hover:text-violet-700 transition-colors"
                  >
                    View Details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
