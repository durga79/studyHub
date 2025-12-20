"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { trpc } from "@/lib/trpc/react"
import { assignmentSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/shared/file-upload"
import { ASSIGNMENT_CATEGORIES } from "@/lib/constants"
import { toast } from "sonner"

type AssignmentFormData = {
  title: string
  description: string
  category: string
  tags?: string[]
  deadline: Date
  videoRequirements?: string
  price?: number
}

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [step, setStep] = useState<"details" | "files" | "review">("details")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    getValues,
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
  })

  const createAssignment = trpc.assignments.create.useMutation()
  const addFiles = trpc.assignments.addFiles.useMutation()
  const publishAssignment = trpc.assignments.publish.useMutation()

  const onSubmit = async (data: AssignmentFormData) => {
    if (step === "details") {
      setStep("files")
      return
    }

    try {
      const deadline = new Date(data.deadline)
      const assignment = await createAssignment.mutateAsync({
        ...data,
        deadline,
        category: data.category as any,
      })

      if (uploadedFiles.length > 0) {
        await addFiles.mutateAsync({
          assignmentId: assignment.id,
          files: uploadedFiles,
        })
      }

      await publishAssignment.mutateAsync({ id: assignment.id })

      toast.success("Assignment created and published successfully")
      router.push("/dashboard/student/assignments")
    } catch (error) {
      toast.error("Failed to create assignment")
    }
  }

  const saveDraft = async () => {
    try {
      const data = getValues()
      const deadline = new Date(data.deadline)
      const assignment = await createAssignment.mutateAsync({
        ...data,
        deadline,
        category: data.category as any,
      })

      if (uploadedFiles.length > 0) {
        await addFiles.mutateAsync({
          assignmentId: assignment.id,
          files: uploadedFiles,
        })
      }

      toast.success("Assignment saved as draft")
      router.push("/dashboard/student/assignments")
    } catch (error) {
      toast.error("Failed to save draft")
    }
  }

  const formData = watch()
  const isLoading = createAssignment.isPending || addFiles.isPending || publishAssignment.isPending

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Create New Assignment</CardTitle>
          <CardDescription>
            {step === "details" && "Fill in your assignment details"}
            {step === "files" && "Upload any supporting files"}
            {step === "review" && "Review and publish your assignment"}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <div className={`h-2 flex-1 rounded ${step === "details" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded ${step === "files" ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 flex-1 rounded ${step === "review" ? "bg-primary" : "bg-muted"}`} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {step === "details" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    {...register("title")}
                    placeholder="Enter assignment title"
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
                    placeholder="Describe your assignment requirements in detail"
                    rows={6}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <p className="text-sm text-destructive">
                        {errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      {...register("deadline", { valueAsDate: true })}
                    />
                    {errors.deadline && (
                      <p className="text-sm text-destructive">
                        {errors.deadline.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Budget (Optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="You can negotiate via chat"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoRequirements">Video Requirements (Optional)</Label>
                  <Textarea
                    id="videoRequirements"
                    {...register("videoRequirements")}
                    placeholder="Any specific video instructions or requirements"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit">Continue to Files</Button>
                </div>
              </>
            )}

            {step === "files" && (
              <>
                <FileUpload
                  onFilesUploaded={setUploadedFiles}
                  maxFiles={10}
                  accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png"
                />

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep("details")}>
                    Back
                  </Button>
                  <Button type="button" onClick={() => setStep("review")}>
                    Continue to Review
                  </Button>
                </div>
              </>
            )}

            {step === "review" && (
              <>
                <div className="space-y-4 border rounded-lg p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Title</p>
                    <p className="font-medium">{formData.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="whitespace-pre-wrap">{formData.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{formData.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-medium">
                        {formData.deadline ? new Date(formData.deadline).toLocaleString() : "Not set"}
                      </p>
                    </div>
                  </div>
                  {formData.price && (
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="font-medium">${formData.price}</p>
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Files</p>
                      <p className="font-medium">{uploadedFiles.length} file(s) attached</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setStep("files")}>
                    Back
                  </Button>
                  <Button type="button" variant="secondary" onClick={saveDraft} disabled={isLoading}>
                    Save as Draft
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Publishing..." : "Publish Assignment"}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
