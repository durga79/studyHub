"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { trpc } from "@/lib/trpc/react"
import { projectSchema } from "@/lib/validations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileUpload } from "@/components/shared/file-upload"
import { ASSIGNMENT_CATEGORIES } from "@/lib/constants"
import { Plus, ShoppingBag, Edit, Trash, DollarSign, Users } from "lucide-react"
import { toast } from "sonner"

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

type ProjectFormData = {
  title: string
  description: string
  category: string
  price: number
  tags?: string[]
}

export default function FreelancerMarketplacePage() {
  const utils = trpc.useUtils()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const { data: projects, isLoading } = trpc.marketplace.getMyProjects.useQuery()
  const { data: stats } = trpc.marketplace.getStats.useQuery()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  })

  const createProject = trpc.marketplace.create.useMutation({
    onSuccess: async (project) => {
      if (uploadedFiles.length > 0) {
        await addFiles.mutateAsync({
          projectId: project.id,
          files: uploadedFiles,
        })
      }
      toast.success("Project created successfully")
      setShowCreateDialog(false)
      reset()
      setUploadedFiles([])
      utils.marketplace.getMyProjects.invalidate()
      utils.marketplace.getStats.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const addFiles = trpc.marketplace.addFiles.useMutation()

  const updateProject = trpc.marketplace.update.useMutation({
    onSuccess: () => {
      toast.success("Project updated")
      utils.marketplace.getMyProjects.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteProject = trpc.marketplace.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted")
      utils.marketplace.getMyProjects.invalidate()
      utils.marketplace.getStats.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const onSubmit = (data: ProjectFormData) => {
    createProject.mutate({
      ...data,
      category: data.category as any,
    })
  }

  const toggleActive = (id: string, isActive: boolean) => {
    updateProject.mutate({ id, isActive: !isActive })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your completed projects in the marketplace
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              List Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>List New Project</DialogTitle>
              <DialogDescription>
                Create a new project to sell in the marketplace
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Project title"
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe what this project includes..."
                  rows={4}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    onValueChange={(value) => setValue("category", value)}
                    value={watch("category")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="49.99"
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Project Files</Label>
                <FileUpload
                  onFilesUploaded={setUploadedFiles}
                  maxFiles={10}
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProject.isPending}
                  className="flex-1"
                >
                  {createProject.isPending ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalProjects || 0}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.activeProjects || 0}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalSales || 0}</p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${stats?.totalEarnings?.toFixed(2) || "0.00"}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <p>Loading projects...</p>
      ) : !projects || projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No projects listed yet</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              List Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <Badge variant={project.isActive ? "default" : "secondary"}>
                    {project.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription>{project.category}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {project.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-2xl font-bold">${project.price}</span>
                  <span className="text-sm text-muted-foreground">
                    {project.purchases?.length || 0} sales
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => toggleActive(project.id, project.isActive ?? false)}
                  >
                    {project.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this project?")) {
                        deleteProject.mutate({ id: project.id })
                      }
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
