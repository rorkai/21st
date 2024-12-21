// pnpm run migrate-r2

import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import path from "path"
import dotenv from "dotenv"
import { Readable } from "stream"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Обработчик необработанных отклонений промисов
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

try {
  // Загружаем .env.local из корня web приложения
  dotenv.config({ path: path.resolve(__dirname, "../.env.local") })

  // Validate environment variables
  if (
    !process.env.R2_ACCESS_KEY_ID ||
    !process.env.R2_SECRET_ACCESS_KEY ||
    !process.env.NEXT_PUBLIC_R2_ENDPOINT
  ) {
    throw new Error(
      "R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and NEXT_PUBLIC_R2_ENDPOINT must be set",
    )
  }

  const bucketName = "components-code" // Имя вашего R2 бакета

  const r2Client = new S3Client({
    region: "auto",
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  })

  console.log("R2 Configuration:", {
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID?.slice(0, 5) + "...",
    bucketName,
  })

  async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = []
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on("error", (err) => reject(err))
      stream.on("end", () => resolve(Buffer.concat(chunks)))
    })
  }

  async function migrateFile(oldPath: string): Promise<string> {
    try {
      console.log(`Starting migration of ${oldPath}`)
      const fileName = oldPath.split("/").pop()
      if (!fileName) throw new Error("Invalid file path")

      const getCommand = new GetObjectCommand({
        Bucket: bucketName,
        Key: oldPath,
      })

      console.log(`Fetching file ${oldPath}...`)
      const response = await r2Client.send(getCommand)

      if (!response.Body) {
        throw new Error("Empty response body")
      }

      console.log(`Converting stream to buffer...`)
      const content = await streamToBuffer(response.Body as Readable)

      const newPath = `user_nyxbui/${fileName}`
      console.log(`Uploading to ${newPath}...`)

      const putCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: newPath,
        Body: content,
        ContentType: response.ContentType,
      })

      await r2Client.send(putCommand)
      console.log(`Successfully uploaded to ${newPath}`)

      return newPath
    } catch (error: any) {
      console.error(`Error migrating file ${oldPath}:`, {
        name: error.name,
        message: error.message,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        stack: error.stack,
      })
      throw error
    }
  }

  async function testConnection(): Promise<boolean> {
    try {
      console.log("Testing connection to R2...")
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: "test.txt",
      })
      await r2Client.send(command)
      return true
    } catch (error: any) {
      if (error.Code === "NoSuchKey") {
        console.log("Connection successful, but file not found (expected)")
        return true
      }
      console.error("Connection test failed:", {
        name: error.name,
        message: error.message,
        code: error.Code,
        statusCode: error.$metadata?.httpStatusCode,
        stack: error.stack,
      })
      return false
    }
  }

  // Запускаем основной код в самовызывающейся асинхронной функции
  ;(async () => {
    try {
      const isConnected = await testConnection()
      if (!isConnected) {
        console.error("Failed to connect to R2")
        process.exit(1)
      }

      console.log("R2 connection successful, proceeding with migration...")

      const filePaths = [
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/stepper.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/stepper.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/stepper.png",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/stepper.tailwind.config.js",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/timeline.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/timeline.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/timeline.png",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/video-modal.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/video-modal.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/video-modal.png",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/video-modal.tailwind.config.js",
      ]

      for (const oldPath of filePaths) {
        try {
          const newPath = await migrateFile(oldPath)
          console.log(`Successfully migrated ${oldPath} to ${newPath}`)
        } catch (error) {
          console.error(`Failed to migrate ${oldPath}`)
        }
      }
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
