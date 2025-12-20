"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDate, formatDateTime, formatFileSize } from "@/lib/utils"
import { ASSIGNMENT_STATUS } from "@/lib/constants"
import { FileText, Download, MessageSquare, CheckCircle, XCircle, DollarSign, Clock, User } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function AssignmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [upiId, setUpiId] = useState("")
  const [feedback, setFeedback] = useState("")

  const { data: assignment, isLoading, refetch } = trpc.assignments.getById.useQuery({
    id: params.id as string,
  })

  const publishAssignment = trpc.assignments.publish.useMutation({
    onSuccess: () => {
      toast.success("Assignment published")
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  const reviewSubmission = trpc.assignments.reviewSubmission.useMutation({
    onSuccess: () => {
      toast.success("Review submitted")
      setShowReviewDialog(false)
      refetch()
    },
    onError: (error) => toast.error(error.message),
  })

  const createPayment = trpc.payments.create.useMutation({
    onSuccess: () => {
      toast.success("Payment initiated")
      setShowPaymentDialog(false)
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

  const freelancer = assignment.freelancers?.[0]?.freelancer
  const submittedFiles = assignment.freelancers?.[0]?.submittedFiles as string[] | undefined

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

  const handleApprove = () => {
    reviewSubmission.mutate({
      assignmentId: assignment.id,
      approved: true,
    })
  }

  const handleRequestRevision = () => {
    if (!feedback.trim()) {
      toast.error("Please provide feedback for the revision")
      return
    }
    reviewSubmission.mutate({
      assignmentId: assignment.id,
      approved: false,
      feedback,
    })
  }

  const handlePayment = () => {
    if (!freelancer || !upiId.trim()) {
      toast.error("Please enter UPI ID")
      return
    }
    createPayment.mutate({
      assignmentId: assignment.id,
      freelancerId: freelancer.id,
      amount: parseFloat(assignment.price || "0"),
      upiId,
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
                <CardTitle>Attached Files</CardTitle>
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

          {assignment.status === "submitted" && submittedFiles && submittedFiles.length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Submitted Work
                </CardTitle>
                <CardDescription>Review the freelancer submission</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {submittedFiles.map((fileUrl, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm">Submission File {index + 1}</span>
                      </div>
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleApprove} className="flex-1">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Work
                  </Button>
                  <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <XCircle className="mr-2 h-4 w-4" />
                        Request Revision
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Revision</DialogTitle>
                        <DialogDescription>
                          Provide feedback for the freelancer
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Feedback</Label>
                          <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Describe what needs to be revised..."
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleRequestRevision} className="w-full">
                          Submit Feedback
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}

          {assignment.status === "completed" && freelancer && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Payment Required
                </CardTitle>
                <CardDescription>Complete payment to the freelancer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <span className="font-medium">Amount Due</span>
                    <span className="text-2xl font-bold">${assignment.price || "0.00"}</span>
                  </div>
                  <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Make Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Payment Details</DialogTitle>
                        <DialogDescription>
                          Enter the freelancers UPI ID to initiate payment
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Freelancer UPI ID</Label>
                          <Input
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="freelancer@upi"
                          />
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Amount</p>
                          <p className="text-2xl font-bold">${assignment.price || "0.00"}</p>
                        </div>
                        <Button onClick={handlePayment} className="w-full">
                          Confirm Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">${assignment.price}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(assignment.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {freelancer && (
            <Card>
              <CardHeader>
                <CardTitle>Freelancer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {freelancer.firstName?.[0] || "F"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {freelancer.firstName} {freelancer.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{freelancer.email}</p>
                  </div>
                </div>
                <Link href={`/dashboard/student/messages?user=${freelancer.id}`}>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {assignment.status === "draft" && (
            <Button
              onClick={() => publishAssignment.mutate({ id: assignment.id })}
              className="w-full"
            >
              Publish Assignment
            </Button>
          )}

          <Button variant="outline" className="w-full" onClick={() => router.back()}>
            Back to Assignments
          </Button>
        </div>
      </div>
    </div>
  )
}


