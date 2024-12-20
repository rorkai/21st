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

      const newPath = `user_originui/${fileName}`
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
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-helper-text.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-helper-text.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-hint.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-hint.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-colored-border-and-ring.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-colored-border-and-ring.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-error.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-error.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-gray-background.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-gray-background.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/disabled-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/disabled-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-icon.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-icon.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-icon.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-icon.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-inline-add-on.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-inline-add-on.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-inline-add-on.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-inline-add-on.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inline-add-ons.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inline-add-ons.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-add-on.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-add-on.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-add-on.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-add-on.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inline-start-and-end-add-on.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inline-start-and-end-add-on.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-mask.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-mask.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/timestamp-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/timestamp-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-tags.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-tags.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inner-tags.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inner-tags.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-textarea.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-textarea.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-helper-text.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-helper-text.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-hint.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-hint.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-error.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-error.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-gray-background.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-gray-background.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/disabled-textarea.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/disabled-textarea.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-left-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-left-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-right-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-right-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-overlapping-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-overlapping-label.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-label-animation.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-label-animation.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-inset-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-inset-label.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-characters-left.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-characters-left.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-no-resize.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/textarea-with-no-resize.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/autogrowing-textarea.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/autogrowing-textarea.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/simple-select-with-default-value.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/simple-select-with-default-value.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-placeholder.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-placeholder.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-icon.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-icon.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-error.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-error.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-gray-background.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-gray-background.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-select.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/required-select.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-helper-text.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-helper-text.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-auto-width.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-auto-width.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/disabled-select.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/disabled-select.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-overlapping-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-overlapping-label.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-disabled-options.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-disabled-options.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-inset-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-inset-label.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-right-indicator.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-right-indicator.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/status-select.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/status-select.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icons.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icons.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-left-text.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-left-text.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icon-and-right-indicator.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icon-and-right-indicator.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-description-and-right-indicator.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/select-with-description-and-right-indicator.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-flag.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-flag.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-search.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-search.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/options-with-portrait.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/options-with-portrait.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-search-and-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-with-search-and-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icon-and-number.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/select-options-with-icon-and-number.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/timezone-select-with-search.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/timezone-select-with-search.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-single-option.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-single-option.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-multiple-options.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-multiple-options.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-option-groups.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/listbox-with-option-groups.demo.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/simple-slider.tsx",
        "user_2qRK29ssFQqXVoQJMy4qdj6PIt5/simple-slider.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-select.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-start-select.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-select.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-select.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-inline-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-inline-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-icon-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-icon-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-end-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/show-hide-password-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/show-hide-password-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-clear-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-clear-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-kbd.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-kbd.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-icon-and-button.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-icon-and-button.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-loader.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/search-input-with-loader.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/number-input-with-plus-minus-buttons.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/number-input-with-plus-minus-buttons.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/number-input-with-chevrons.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/number-input-with-chevrons.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-overlapping-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-overlapping-label.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-label-animation.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-label-animation.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inset-label.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-inset-label.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-character-limit.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-character-limit.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-characters-left.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-characters-left.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/time-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/time-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/time-input-with-start-icon.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/time-input-with-start-icon.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-and-time-input.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-and-time-input.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-picker.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/date-picker.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-single.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-single.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-double.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-double.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-spaced.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/otp-input-spaced.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/card-number.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/card-number.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/expiry-date.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/expiry-date.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/cvc-code.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/cvc-code.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/card-details.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/card-details.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-password-strength-indicator.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/input-with-password-strength-indicator.demo.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/copy-to-clipboard.tsx",
        "user_2nElBLvklOKlAURm6W1PTu6yYFh/copy-to-clipboard.demo.tsx"
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
