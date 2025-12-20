"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"
import { UserCheck, UserX, Search, Mail } from "lucide-react"
import { toast } from "sonner"

export default function AdminFreelancersPage() {
  const utils = trpc.useUtils()
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending")
  const [search, setSearch] = useState("")

  const { data: freelancers, isLoading } = trpc.users.listFreelancers.useQuery({
    approved: filter === "all" ? undefined : filter === "approved",
  })

  const approveFreelancer = trpc.users.approveFreelancer.useMutation({
    onSuccess: () => {
      toast.success("Freelancer status updated")
      utils.users.listFreelancers.invalidate()
      utils.users.getStats.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const filteredFreelancers = freelancers?.filter((f) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      f.firstName?.toLowerCase().includes(searchLower) ||
      f.lastName?.toLowerCase().includes(searchLower) ||
      f.email.toLowerCase().includes(searchLower)
    )
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p>Loading freelancers...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Freelancer Management</h1>
        <p className="text-muted-foreground mt-1">
          Approve and manage freelancer accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <CardTitle>Freelancers</CardTitle>
              <CardDescription>
                {filteredFreelancers?.length || 0} freelancer(s) found
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!filteredFreelancers || filteredFreelancers.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No freelancers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <div
                  key={freelancer.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                      {freelancer.firstName?.[0] || freelancer.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {freelancer.firstName} {freelancer.lastName}
                        </p>
                        <Badge variant={freelancer.isApproved ? "default" : "secondary"}>
                          {freelancer.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {freelancer.email}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Joined: {formatDate(freelancer.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {freelancer.isApproved ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          approveFreelancer.mutate({
                            userId: freelancer.id,
                            approved: false,
                          })
                        }
                        disabled={approveFreelancer.isPending}
                      >
                        <UserX className="mr-1 h-4 w-4" />
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() =>
                          approveFreelancer.mutate({
                            userId: freelancer.id,
                            approved: true,
                          })
                        }
                        disabled={approveFreelancer.isPending}
                      >
                        <UserCheck className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
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


