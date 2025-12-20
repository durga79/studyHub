"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatFileSize } from "@/lib/utils"
import { Upload, X, FileText, Image, Video, File, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void
  maxFiles?: number
  accept?: string
  maxSize?: number
}

export function FileUpload({
  onFilesUploaded,
  maxFiles = 10,
  accept = ".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png",
  maxSize = 25 * 1024 * 1024,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" alt="image" />
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const newFiles = Array.from(e.target.files)
    const validFiles: File[] = []

    for (const file of newFiles) {
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds the size limit`)
        continue
      }
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
        break
      }
      validFiles.push(file)
    }

    if (validFiles.length === 0) return

    setUploading(true)
    const uploaded: UploadedFile[] = []

    try {
      for (const file of validFiles) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        uploaded.push({
          fileName: data.fileName,
          fileUrl: data.url,
          fileSize: data.fileSize,
          fileType: file.type,
        })
      }

      const allUploaded = [...uploadedFiles, ...uploaded]
      setUploadedFiles(allUploaded)
      onFilesUploaded(allUploaded)
      toast.success(`${uploaded.length} file(s) uploaded successfully`)
    } catch (error) {
      toast.error("Failed to upload some files")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const removeUploadedFile = (index: number) => {
    const updated = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(updated)
    onFilesUploaded(updated)
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Uploading files...</p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Click to browse and upload files
            </p>
            <Input
              type="file"
              multiple
              accept={accept}
              onChange={handleFileSelect}
              className="max-w-xs mx-auto"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Files are uploaded automatically when selected
            </p>
          </>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">
            Uploaded ({uploadedFiles.length} file{uploadedFiles.length > 1 ? "s" : ""}):
          </p>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {getFileIcon(file.fileType)}
                <span className="text-sm">{file.fileName}</span>
                <span className="text-xs text-muted-foreground">
                  ({formatFileSize(file.fileSize)})
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeUploadedFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
