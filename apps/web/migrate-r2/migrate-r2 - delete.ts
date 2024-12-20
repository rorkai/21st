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

  const user1Files = [
    "required-input",
    "input-with-helper-text", 
    "input-with-hint",
    "input-with-colored-border-and-ring",
    "input-with-error",
    "input-with-gray-background",
    "disabled-input",
    "input-with-start-icon",
    "input-with-end-icon",
    "input-with-start-inline-add-on",
    "input-with-end-inline-add-on",
    "input-with-inline-add-ons",
    "input-with-start-add-on",
    "input-with-end-add-on",
    "input-with-inline-start-and-end-add-on",
    "input-with-mask",
    "timestamp-input",
    "input-with-tags",
    "input-with-inner-tags",
    "required-textarea",
    "textarea-with-helper-text",
    "textarea-with-hint",
    "textarea-with-error",
    "textarea-with-gray-background",
    "disabled-textarea",
    "textarea-with-left-button",
    "textarea-with-right-button",
    "textarea-with-button",
    "textarea-with-overlapping-label",
    "textarea-with-label-animation",
    "textarea-with-inset-label",
    "textarea-with-characters-left",
    "textarea-with-no-resize",
    "autogrowing-textarea",
    "simple-select-with-default-value",
    "select-with-error",
    "select-with-gray-background",
    "required-select",
    "select-with-auto-width",
    "select-with-overlapping-label",
    "select-with-inset-label",
    "select-with-right-indicator",
    "status-select",
    "select-options-with-icons",
    "select-options-with-icon-and-right-indicator",
    "select-options-with-flag",
    "select-with-search",
    "select-with-search-and-button",
    "select-options-with-icon-and-number",
    "input-with-start-select",
    "input-with-end-select",
    "input-with-end-inline-button",
    "input-with-end-icon-button",
    "input-with-end-button",
    "input-with-button",
    "show-hide-password-input",
    "input-with-clear-button",
    "search-input-with-kbd",
    "search-input-with-icon-and-button",
    "search-input-with-loader",
    "number-input-with-plus-minus-buttons",
    "number-input-with-chevrons",
    "input-with-overlapping-label",
    "input-with-label-animation",
    "input-with-inset-label",
    "input-with-character-limit",
    "input-with-characters-left",
    "date-input",
    "time-input",
    "time-input-with-start-icon",
    "date-and-time-input",
    "date-picker",
    "otp-input-single",
    "otp-input-double",
    "otp-input-spaced",
    "card-number",
    "expiry-date",
    "cvc-code",
    "card-details",
    "input-with-password-strength-indicator",
    "copy-to-clipboard"
  ].flatMap((base) => [
    `user_2nElBLvklOKlAURm6W1PTu6yYFh/${base}.tsx`,
    `user_2nElBLvklOKlAURm6W1PTu6yYFh/${base}.demo.tsx`,
    `user_2nElBLvklOKlAURm6W1PTu6yYFh/${base}.png`,
  ])

  const user2Files = [
    "select-with-placeholder",
    "select-with-icon",
    "select-with-helper-text",
    "disabled-select",
    "select-with-disabled-options",
    "select-with-left-text",
    "select-with-description-and-right-indicator",
    "options-with-portrait",
    "timezone-select-with-search",
    "listbox-with-single-option",
    "listbox-with-multiple-options", 
    "listbox-with-option-groups",
    "simple-slider"
  ].flatMap((base) => [
    `user_2qRK29ssFQqXVoQJMy4qdj6PIt5/${base}.tsx`,
    `user_2qRK29ssFQqXVoQJMy4qdj6PIt5/${base}.demo.tsx`,
    `user_2qRK29ssFQqXVoQJMy4qdj6PIt5/${base}.png`,
  ])

  const filesToDelete = [...user1Files, ...user2Files]

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
