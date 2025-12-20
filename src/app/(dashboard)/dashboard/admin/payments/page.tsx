"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDateTime, formatDate } from "@/lib/utils"
import { Check, X, Image, DollarSign, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminPaymentsPage() {
  const utils = trpc.useUtils()
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending")
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null)

  const { data: payments, isLoading } = trpc.payments.listAll.useQuery({
    status: filter === "all" ? undefined : filter,
  })

  const { data: stats } = trpc.payments.getStats.useQuery()

  const verifyPayment = trpc.payments.verify.useMutation({
    onSuccess: () => {
      toast.success("Payment verification updated")
      utils.payments.listAll.invalidate()
      utils.payments.getStats.invalidate()
      setSelectedPayment(null)
    },
    onError: (error) => {
      toast.error(error.message || "Failed to verify payment")
    },
  })

  const handleVerify = (paymentId: string, status: "verified" | "rejected") => {
    verifyPayment.mutate({ paymentId, status })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
      case "verified":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading payments...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Payment Verifications</h1>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.verified || 0}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.rejected || 0}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">${stats?.totalAmount?.toFixed(2) || "0.00"}</p>
                <p className="text-sm text-muted-foreground">Total Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Review and verify payment submissions</CardDescription>
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">{(payment.assignment as any)?.title || "Unknown Assignment"}</p>
                      {getStatusBadge(payment.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Amount</p>
                        <p className="font-medium">${payment.amount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Student</p>
                        <p>{(payment.student as any)?.firstName} {(payment.student as any)?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Freelancer</p>
                        <p>{(payment.freelancer as any)?.firstName} {(payment.freelancer as any)?.lastName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">UPI ID</p>
                        <p className="font-mono text-xs">{payment.upiId}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {formatDateTime(payment.createdAt)}
                      {payment.verifiedAt && (
                        <> • Verified: {formatDateTime(payment.verifiedAt)}</>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {payment.screenshots && payment.screenshots.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Image className="h-4 w-4 mr-1" />
                            Screenshots ({payment.screenshots.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Payment Screenshots</DialogTitle>
                            <DialogDescription>
                              Review the payment proof uploaded by the student
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4">
                            {payment.screenshots.map((screenshot) => (
                              <a
                                key={screenshot.id}
                                href={screenshot.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={screenshot.fileUrl}
                                  alt="Payment screenshot"
                                  className="w-full rounded-lg border"
                                />
                              </a>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    {payment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleVerify(payment.id, "verified")}
                          disabled={verifyPayment.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleVerify(payment.id, "rejected")}
                          disabled={verifyPayment.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
