"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ASSIGNMENT_CATEGORIES } from "@/lib/constants"
import { Search, ShoppingBag } from "lucide-react"
import { toast } from "sonner"

export default function MarketplacePage() {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("")

  const { data: projects, isLoading } = trpc.marketplace.list.useQuery({
    category: category || undefined,
    search: search || undefined,
  })

  const purchaseProject = trpc.marketplace.purchase.useMutation({
    onSuccess: () => {
      toast.success("Project purchased successfully")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to purchase project")
    },
  })

  const handlePurchase = (projectId: string) => {
    purchaseProject.mutate({ projectId })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Project Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and purchase completed projects
        </p>
      </div>

      <div className="mb-6 space-y-4 md:flex md:space-y-0 md:gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
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
      </div>

      {isLoading ? (
        <p>Loading projects...</p>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge variant="outline">{project.category}</Badge>
                </div>
                <CardDescription>
                  By {(project.freelancer as any)?.firstName} {(project.freelancer as any)?.lastName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {project.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">${project.price}</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(project.id)}
                  disabled={purchaseProject.isPending}
                >
                  Purchase Project
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

