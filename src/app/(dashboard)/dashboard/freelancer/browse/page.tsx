"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { ASSIGNMENT_CATEGORIES } from "@/lib/constants"
import Link from "next/link"
import { Search } from "lucide-react"

export default function BrowseAssignmentsPage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("")
  const [sortBy, setSortBy] = useState<"newest" | "price" | "deadline">("newest")

  const { data: assignments, isLoading } = trpc.assignments.list.useQuery({
    status: "posted",
    category: category || undefined,
    search: search || undefined,
    sortBy,
  })

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Browse Assignments</h1>
        <p className="text-muted-foreground">
          Find assignments that match your skills
        </p>
      </div>

      <div className="mb-6 space-y-4 md:flex md:space-y-0 md:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {ASSIGNMENT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price">Price: High to Low</SelectItem>
            <SelectItem value="deadline">Deadline: Soonest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p>Loading assignments...</p>
      ) : !assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No assignments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <Badge variant="outline">{assignment.category}</Badge>
                </div>
                <CardDescription>
                  By {(assignment.student as any)?.firstName} {(assignment.student as any)?.lastName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {assignment.description}
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span>{formatDate(assignment.deadline)}</span>
                  </div>
                  {assignment.price && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">${assignment.price}</span>
                    </div>
                  )}
                </div>
                <Link href={`/dashboard/freelancer/assignments/${assignment.id}`}>
                  <Button className="w-full">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

