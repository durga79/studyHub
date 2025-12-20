"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/shared/file-upload"
import { formatDate, formatFileSize } from "@/lib/utils"
import { FileText, Download, MessageSquare, CheckCircle, Play, Upload, Clock, DollarSign, User } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export default function FreelancerAssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const { data: user } = trpc.users.getCurrent.useQuery()

  const { data: assignment, isLoading, refetch } = trpc.assignments.getById.useQuery({
    id: params.id as string,
  })

  const acceptAssignment = trpc.assignments.accept.useMutation({
    onSuccess: () => {
      toast.success("Assignment accepted!")
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  const startWork = trpc.assignments.startWork.useMutation({
    onSuccess: () => {
      toast.success("Started working on assignment")
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  const submitWork = trpc.assignments.submitWork.useMutation({
    onSuccess: () => {
      toast.success("Work submitted successfully!")
      setShowSubmitDialog(false)
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading assignment...</p>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="container mx-auto p-6">
        <p>Assignment not found</p>
      </div>
    )
  }

  const myAssignment = assignment.freelancers?.find(
    (f) => f.freelancer.id === user?.id
  )
  const isAssignedToMe = !!myAssignment
  const canAccept = assignment.status === "posted" && !isAssignedToMe

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary"
      case "posted": return "default"
      case "assigned": return "default"
      case "in_progress": return "default"
      case "submitted": return "default"
      case "completed": return "default"
      case "paid": return "default"
      default: return "secondary"
    }
  }

  const handleSubmit = () => {
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one file")
      return
    }
    submitWork.mutate({
      assignmentId: assignment.id,
      files: uploadedFiles.map((f) => f.fileUrl),
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">{assignment.category}</p>
        </div>
        <Badge variant={getStatusColor(assignment.status)} className="text-sm px-3 py-1">
          {assignment.status.replace("_", " ").toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{assignment.description}</p>
              {assignment.videoRequirements && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="font-medium mb-2">Video Requirements</p>
                  <p className="text-sm">{assignment.videoRequirements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {assignment.files && assignment.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Assignment Files</CardTitle>
                <CardDescription>Download these files to understand the requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assignment.files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">{file.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                          ({formatFileSize(file.fileSize)})
                        </span>
                      </div>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {isAssignedToMe && (assignment.status === "assigned" || assignment.status === "in_progress") && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Submit Your Work
                </CardTitle>
                <CardDescription>Upload your completed work files</CardDescription>
              </CardHeader>
              <CardContent>
                {assignment.status === "assigned" && (
                  <Button
                    onClick={() => startWork.mutate({ assignmentId: assignment.id })}
                    className="w-full mb-4"
                    disabled={startWork.isPending}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Start Working
                  </Button>
                )}
                
                {assignment.status === "in_progress" && (
                  <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Submit Work
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Submit Your Work</DialogTitle>
                        <DialogDescription>
                          Upload your completed files for this assignment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <FileUpload
                          onFilesUploaded={setUploadedFiles}
                          maxFiles={20}
                          accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png,.mp4,.webm"
                        />
                        <Button
                          onClick={handleSubmit}
                          className="w-full"
                          disabled={submitWork.isPending || uploadedFiles.length === 0}
                        >
                          {submitWork.isPending ? "Submitting..." : "Submit Work"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )}

          {isAssignedToMe && assignment.status === "submitted" && (
            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  Under Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your work has been submitted and is awaiting review from the student.
                </p>
              </CardContent>
            </Card>
          )}

          {isAssignedToMe && (assignment.status === "completed" || assignment.status === "paid") && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  {assignment.status === "paid" ? "Paid" : "Completed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {assignment.status === "paid"
                    ? "Payment has been received for this assignment."
                    : "Your work has been approved. Payment is pending."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="font-medium">{formatDate(assignment.deadline)}</p>
                </div>
              </div>
              {assignment.price && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment</p>
                    <p className="font-medium text-green-600">${assignment.price}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Posted by</p>
                  <p className="font-medium">
                    {(assignment.student as any)?.firstName} {(assignment.student as any)?.lastName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canAccept && (
            <Button
              onClick={() => acceptAssignment.mutate({ assignmentId: assignment.id })}
              className="w-full"
              disabled={acceptAssignment.isPending}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {acceptAssignment.isPending ? "Accepting..." : "Accept Assignment"}
            </Button>
          )}

          {isAssignedToMe && assignment.student && (() => {
            const student = assignment.student as any
            return (
            <Card>
              <CardHeader>
                <CardTitle>Student</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {student?.firstName?.[0] || "S"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {student?.firstName} {student?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{student?.email}</p>
                  </div>
                </div>
                <Link href={`/dashboard/freelancer/messages?user=${student?.id}`}>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )})()}

          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

