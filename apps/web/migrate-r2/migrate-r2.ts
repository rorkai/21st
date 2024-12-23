// pnpm run migrate-r2

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
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

  async function migrateComponent(oldUserId: string, newUserId: string, componentSlug: string, shouldDelete: boolean = false): Promise<void> {
    const fileTypes = [
      { suffix: '.tsx', required: true },
      { suffix: '.demo.tsx', required: true },
      { suffix: '.png', required: true },
      { suffix: '.mp4', required: false },
      { suffix: '.tailwind.config.js', required: false },
      { suffix: '.global.css', required: false },
    ]

    for (const { suffix, required } of fileTypes) {
      const oldPath = `${oldUserId}/${componentSlug}${suffix}`
      const newPath = `${newUserId}/${componentSlug}${suffix}`

      try {
        // Try to get the file
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: oldPath,
        })

        const response = await r2Client.send(getCommand)

        // If file exists, migrate it
        if (response.Body) {
          const content = await streamToBuffer(response.Body as Readable)
          
          // Upload to new location
          const putCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: newPath,
            Body: content,
            ContentType: response.ContentType,
          })
          await r2Client.send(putCommand)
          console.log(`Successfully copied ${oldPath} to ${newPath}`)

          // Delete original if requested
          if (shouldDelete) {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: bucketName,
              Key: oldPath,
            })
            await r2Client.send(deleteCommand)
            console.log(`Deleted original file: ${oldPath}`)
          }
        }
      } catch (error: any) {
        if (required) {
          console.error(`Error processing required file ${oldPath}:`, error.message)
          throw error
        } else {
          console.log(`Optional file ${oldPath} not found, skipping...`)
        }
      }
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

      const components = [
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_shadcn', componentSlug: 'calendar' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_shadcn', componentSlug: 'date-picker' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'aurora-background' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'floating-navbar' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'tooltip-with-title' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'glowing-background-stars-card' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'background-gradient-animation' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'triple-choose-checkbox-vertical' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'pan-with-titles' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'infinite-moving-cards' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'tooltip-with-stats' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'meteors' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_shadcn', componentSlug: 'chart' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'moving-border' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'scratch-to-reveal' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'android' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'morphing-text' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'interactive-hover-button' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'ripple-button' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_shadcn', componentSlug: 'input-otp' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'social-links-login' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_magicui', componentSlug: 'meteors' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'feature-block-animated-card' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'content-card' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_aceternity', componentSlug: 'code-block' },
        { oldUserId: 'user_2nElBLvklOKlAURm6W1PTu6yYFh', newUserId: 'user_KaraBharat', componentSlug: 'multi-select-combobox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'disabled-checkbox' },
        { oldUserId: 'user_2nA0HITg0H7hvozIDNdxvzinpei', newUserId: 'user_shadcn', componentSlug: 'breadcrumb' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'banner-with-timer' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'simple-tooltip' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'simple-checkbox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'colored-checkbox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'button-with-arrow' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'toggle-group-socials' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'terms-agreement' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'social-links-colored' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'right-aligned-checkbox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'tooltip-with-charts' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'checkbox-with-expansion' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'social-links-login-colored' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'go-back-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'banner-with-rounded-and-close-buttons' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'volume-level-with-buttons' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'print-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'simple-todo-checkbox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'fancy-todo-checkbox' },
        { oldUserId: 'user_2qRK29ssFQqXVoQJMy4qdj6PIt5', newUserId: 'user_originui', componentSlug: 'dropdown-rich-menu' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'triple-choose-checkbox' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'plus-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'email-button-link' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'notification-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'messages-button-with-count' },
        { oldUserId: 'user_2qRK29ssFQqXVoQJMy4qdj6PIt5', newUserId: 'user_originui', componentSlug: 'tabs-simple-squared' },
        { oldUserId: 'user_2qRK29ssFQqXVoQJMy4qdj6PIt5', newUserId: 'user_originui', componentSlug: 'tabs-simple-square-in-cell' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'banner-with-two-buttons-and-close-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'text-align-buttons' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'ai-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'page-selector' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'rounded-button' },
        { oldUserId: 'user_2nA0HITg0H7hvozIDNdxvzinpei', newUserId: 'user_shadcn', componentSlug: 'card' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'cancel-save-buttons' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'banner-with-update-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'banner-with-subscribe-button' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'page-selector-squared' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'three-buttons-selector' },
        { oldUserId: 'user_2qTu81baT6FY4oCqsAJ5WMUdn8i', newUserId: 'user_originui', componentSlug: 'side-selector' }
      ]

      // Step 1: Copy files to new locations
      console.log("\n=== Step 1: Copying files to new locations ===\n")
      for (const { oldUserId, newUserId, componentSlug } of components) {
        try {
          await migrateComponent(oldUserId, newUserId, componentSlug, false)
          console.log(`Successfully copied component ${componentSlug}`)
        } catch (error) {
          console.error(`Failed to copy component ${componentSlug}:`, error)
        }
      }

      // Ask for confirmation before deletion
      console.log("\n=== All files have been copied to new locations ===")
      console.log("Would you like to proceed with deleting the original files? (y/n)")
      
      process.stdin.resume()
      process.stdin.setEncoding('utf8')
      
      process.stdin.once('data', async (data) => {
        const answer = data.toString().trim().toLowerCase()
        
        if (answer === 'y') {
          console.log("\n=== Step 2: Deleting original files ===\n")
          for (const { oldUserId, newUserId, componentSlug } of components) {
            try {
              await migrateComponent(oldUserId, newUserId, componentSlug, true)
              console.log(`Successfully deleted original files for ${componentSlug}`)
            } catch (error) {
              console.error(`Failed to delete original files for ${componentSlug}:`, error)
            }
          }
          console.log("\n=== Migration completed ===")
        } else {
          console.log("\n=== Keeping original files. Migration completed without deletion ===")
        }
        process.exit(0)
      })

    } catch (error: any) {
      console.error("Fatal error:", error)
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
