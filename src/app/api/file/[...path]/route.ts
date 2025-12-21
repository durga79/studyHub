import { NextRequest, NextResponse } from "next/server"
import AWS from "aws-sdk"

const isConfigured =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_NAME

const s3 = isConfigured
  ? new AWS.S3({
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      region: "auto",
      signatureVersion: "v4",
    })
  : null

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  if (!s3 || !isConfigured) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 500 })
  }

  try {
    const key = params.path.join("/")
    
    const signedUrl = await s3.getSignedUrlPromise("getObject", {
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Expires: 3600, // 1 hour
    })

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error("Error getting signed URL:", error)
    return NextResponse.json({ error: "Failed to get file" }, { status: 500 })
  }
}

