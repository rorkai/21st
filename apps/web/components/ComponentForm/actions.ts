/* eslint-disable no-unused-vars */
import { useClerkSupabaseClient } from "@/utils/clerk"
import { FormData } from "./utils"
import { UseFormReturn } from "react-hook-form"
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || '',
  },
});

if (!process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || !process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || !process.env.NEXT_PUBLIC_R2_ENDPOINT) {
  console.error('R2 credentials or endpoint are missing');
}

export const uploadToR2 = async (
  fileName: string,
  content: string | Buffer,
) => {
  try {
    const bucketName = "components-code"

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: content,
      ContentType: "text/plain",
    })

    await r2Client.send(command)

    const publicUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${fileName}`

    return publicUrl
  } catch (error) {
    console.error("Error uploading to R2:", error)
    throw error
  }
}

export const uploadPreviewImageToR2 = async (
  file: File,
  componentSlug: string,
): Promise<string> => {
  try {
    const fileExtension = file.name.split(".").pop()
    const fileName = `${componentSlug}-preview-${Date.now()}.${fileExtension}`
    const bucketName = "components-code"

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
    })

    await r2Client.send(command)

    const publicUrl = `${process.env.NEXT_PUBLIC_CDN_URL}/${fileName}`

    return publicUrl
  } catch (error) {
    console.error("Error uploading preview image to R2:", error)
    throw error
  }
}

export const handleFileChange = (
  event: React.ChangeEvent<HTMLInputElement>,
  setPreviewImage: (image: string) => void,
  form: UseFormReturn<FormData>,
) => {
  const file = event.target.files?.[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5 MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    form.setValue("preview_url", file)
  }
}
