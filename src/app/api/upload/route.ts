import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { uploadFile } from "@/server/storage/r2"
import { FILE_SIZE_LIMITS } from "@/lib/constants"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > FILE_SIZE_LIMITS.ASSIGNMENT_FILE) {
      return NextResponse.json(
        { error: "File size exceeds limit" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const fileUrl = await uploadFile(buffer, file.name, file.type)

    return NextResponse.json({ url: fileUrl, fileName: file.name, fileSize: file.size })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
