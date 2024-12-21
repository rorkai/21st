// migrate-r2.ts delete files from r2

import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3"
import path from "path"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

try {
  dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

  if (
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.NEXT_PUBLIC_R2_ENDPOINT
  ) {
    throw new Error(
      "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and NEXT_PUBLIC_R2_ENDPOINT must be set",
    )
  }

  const bucketName = "components-code"

  const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })

  async function deleteFile(path: string): Promise<void> {
    try {
      console.log(`Deleting file ${path}...`)
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: path,
      })
      await r2Client.send(command)
      console.log(`Successfully deleted ${path}`)
    } catch (error: any) {
      console.error(`Error deleting file ${path}:`, {
        name: error.name,
        message: error.message,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
      })
      throw error
    }
  }

  const filesToDelete = [
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/button-archive.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/button-archive.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/button-archive.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/banner-with-black-white-and-close-button.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/banner-with-black-white-and-close-button.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/banner-with-black-white-and-close-button.png",
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-info.tsx",
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-info.demo.tsx", 
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-info.png",
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-radio-items.tsx",
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-radio-items.demo.tsx",
    "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/dropdown-radio-items.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/cookie-acceptance.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/cookie-acceptance.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/cookie-acceptance.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/error-alert-with-link-and-button.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/error-alert-with-link-and-button.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/error-alert-with-link-and-button.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert-colored.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert-colored.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert-colored.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/requirements-alert.png",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/alert-success.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/alert-success.demo.tsx",
    "user_2qTu81baT6FY4oCqsAJ5WMUdn8i/alert-success.png",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/theme-toggle-button.tsx",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/theme-toggle-button.demo.tsx",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/theme-toggle-button.png",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/button-loading-without-text.tsx",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/button-loading-without-text.demo.tsx",
    "user_2nElBLvklOKlAURm6W1PTu6yYFh/button-loading-without-text.png"
  ]

  ;(async () => {
    try {
      console.log(`Starting deletion of ${filesToDelete.length} files...`)

      await Promise.all(
        filesToDelete.map(async (path) => {
          try {
            await deleteFile(path)
          } catch (error) {
            console.error(`Failed to delete ${path}`)
          }
        }),
      )

      console.log("Deletion completed")
    } catch (error: any) {
      console.error("Fatal error:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      })
      process.exit(1)
    }
  })()
} catch (error: any) {
  console.error("Initialization error:", {
    name: error.name,
    message: error.message,
    stack: error.stack,
  })
  process.exit(1)
}
