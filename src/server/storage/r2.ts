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

export const uploadFile = async (
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> => {
  if (!s3 || !isConfigured) {
    throw new Error("R2 storage is not configured")
  }

  const key = `${Date.now()}-${fileName}`

  await s3
    .putObject({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
    .promise()

  const publicUrl = process.env.R2_PUBLIC_URL
    ? `${process.env.R2_PUBLIC_URL}/${key}`
    : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.R2_BUCKET_NAME}/${key}`

  return publicUrl
}

export const deleteFile = async (fileUrl: string): Promise<void> => {
  if (!s3 || !isConfigured) {
    throw new Error("R2 storage is not configured")
  }

  const key = fileUrl.split("/").pop()
  if (!key) return

  await s3
    .deleteObject({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
    .promise()
}

export const getSignedUrl = async (
  fileUrl: string,
  expiresIn: number = 3600
): Promise<string> => {
  if (!s3 || !isConfigured) {
    throw new Error("R2 storage is not configured")
  }

  const key = fileUrl.split("/").pop()
  if (!key) throw new Error("Invalid file URL")

  return s3.getSignedUrlPromise("getObject", {
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Expires: expiresIn,
  })
}
