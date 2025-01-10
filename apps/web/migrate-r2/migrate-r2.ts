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
import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/supabase"

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
    !process.env.NEXT_PUBLIC_R2_ENDPOINT ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Required environment variables are missing")
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

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

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

  async function migrateFile(
    oldPath: string,
    newPath: string,
    shouldDelete: boolean = false,
  ): Promise<boolean> {
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

        // Verify new file exists
        const verifyCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: newPath,
        })
        await r2Client.send(verifyCommand)

        // Delete original if requested and verification passed
        if (shouldDelete) {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: oldPath,
          })
          await r2Client.send(deleteCommand)
          console.log(`Deleted original file: ${oldPath}`)
        }

        return true
      }
      return false
    } catch (error: any) {
      console.error(`Error processing file ${oldPath}:`, error.message)
      return false
    }
  }

  async function updateComponentUrls(
    componentId: number,
    oldUserId: string,
    newUserId: string,
  ) {
    // Get usernames for both users
    const { data: sourceUser, error: sourceError } = await supabase
      .from("users")
      .select("username")
      .eq("id", oldUserId)
      .single()

    if (sourceError) {
      console.error(`Error fetching source user ${oldUserId}:`, sourceError)
      return false
    }

    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("username")
      .eq("id", newUserId)
      .single()

    if (targetError) {
      console.error(`Error fetching target user ${newUserId}:`, targetError)
      return false
    }

    const { data: component, error } = await supabase
      .from("components")
      .select("*")
      .eq("id", componentId)
      .single()

    if (error) {
      console.error(`Error fetching component ${componentId}:`, error)
      return false
    }

    const updates: any = {}

    // Helper function to update URL if it exists
    const updateUrl = (url: string | null) => {
      if (url && url.includes(oldUserId)) {
        return url.replace(oldUserId, newUserId)
      }
      return url
    }

    // Helper function to update dependencies paths
    const updateDependenciesPaths = (dependencies: string[] | null) => {
      if (!dependencies) return dependencies
      return dependencies.map((dep) => {
        if (dep.startsWith(sourceUser.username + "/")) {
          return dep.replace(
            sourceUser.username + "/",
            targetUser.username + "/",
          )
        }
        return dep
      })
    }

    // Update all relevant URLs and dependencies
    if (component) {
      // Update user_id
      updates.user_id = newUserId

      // Update all URLs
      updates.preview_url = updateUrl(component.preview_url)
      updates.video_url = updateUrl(component.video_url)
      updates.code = updateUrl(component.code)
      updates.demo_code = updateUrl(component.demo_code)
      updates.tailwind_config_extension = updateUrl(
        component.tailwind_config_extension,
      )
      updates.global_css_extension = updateUrl(component.global_css_extension)
      updates.compiled_css = updateUrl(component.compiled_css)

      // Update dependencies paths
      if (component.direct_registry_dependencies) {
        updates.direct_registry_dependencies = updateDependenciesPaths(
          component.direct_registry_dependencies as string[],
        )
      }
      if (component.demo_direct_registry_dependencies) {
        updates.demo_direct_registry_dependencies = updateDependenciesPaths(
          component.demo_direct_registry_dependencies as string[],
        )
      }

      const { error: updateError } = await supabase
        .from("components")
        .update(updates)
        .eq("id", component.id)

      if (updateError) {
        console.error(`Error updating component ${componentId}:`, updateError)
        return false
      }

      console.log(
        `Successfully updated URLs and dependencies for component ${componentId}`,
      )
      return true
    }

    return false
  }

  async function askForConfirmation(message: string): Promise<boolean> {
    console.log("\n" + message)
    console.log("Continue? (y/n)")

    return new Promise((resolve) => {
      process.stdin.resume()
      process.stdin.setEncoding("utf8")
      process.stdin.once("data", (data) => {
        const answer = data.toString().trim().toLowerCase()
        resolve(answer === "y")
      })
    })
  }

  // Запускаем основной код в самовызывающейся асинхронной функции
  ;(async () => {
    try {
      // Get source and target user IDs from command line arguments
      const [sourceUserId, targetUserId] = process.argv.slice(2)

      if (!sourceUserId || !targetUserId) {
        console.error("Please provide source and target user IDs as arguments")
        process.exit(1)
      }

      // Get usernames first
      const { data: sourceUser, error: sourceError } = await supabase
        .from("users")
        .select("username")
        .eq("id", sourceUserId)
        .single()

      if (sourceError) {
        throw new Error(`Error fetching source user: ${sourceError.message}`)
      }

      const { data: targetUser, error: targetError } = await supabase
        .from("users")
        .select("username")
        .eq("id", targetUserId)
        .single()

      if (targetError) {
        throw new Error(`Error fetching target user: ${targetError.message}`)
      }

      const confirmed = await askForConfirmation(
        `Found users:\nSource: ${sourceUser.username} (${sourceUserId})\nTarget: ${targetUser.username} (${targetUserId})`,
      )

      if (!confirmed) {
        console.log("Migration cancelled")
        process.exit(0)
      }

      // Get all components for the source user
      const { data: components, error } = await supabase
        .from("components")
        .select("*")
        .eq("user_id", sourceUserId)

      if (error) {
        throw error
      }

      if (!components || components.length === 0) {
        console.log("No components found for the source user")
        process.exit(0)
      }

      console.log(`Found ${components.length} components to migrate`)

      // Step 1: Update database records with confirmation for first component
      console.log("\n=== Step 1: Updating database records ===\n")

      const firstComponent = components[0]
      if (!firstComponent) {
        throw new Error("No components found")
      }

      // Helper function to show before/after for dependencies
      const showDependenciesChanges = (
        oldDeps: string[] | null,
        newDeps: string[] | null,
        type: string,
      ) => {
        console.log(`\n${type}:`)
        console.log("Before:", oldDeps)
        console.log("After:", newDeps)
      }

      // Process first component to show changes
      const updates: any = {}
      const directDeps = firstComponent.direct_registry_dependencies
      const demoDeps = firstComponent.demo_direct_registry_dependencies

      if (Array.isArray(directDeps)) {
        const typedDirectDeps = directDeps as string[]
        updates.direct_registry_dependencies = typedDirectDeps.map((dep) => {
          if (dep.startsWith(sourceUser.username + "/")) {
            return dep.replace(
              sourceUser.username + "/",
              targetUser.username + "/",
            )
          }
          return dep
        })
        showDependenciesChanges(
          typedDirectDeps,
          updates.direct_registry_dependencies,
          "Direct Dependencies",
        )
      }

      if (Array.isArray(demoDeps)) {
        const typedDemoDeps = demoDeps as string[]
        updates.demo_direct_registry_dependencies = typedDemoDeps.map((dep) => {
          if (dep.startsWith(sourceUser.username + "/")) {
            return dep.replace(
              sourceUser.username + "/",
              targetUser.username + "/",
            )
          }
          return dep
        })
        showDependenciesChanges(
          typedDemoDeps,
          updates.demo_direct_registry_dependencies,
          "Demo Dependencies",
        )
      }

      const depsConfirmed = await askForConfirmation(
        "Above are the dependency changes for the first component. Does this look correct?",
      )

      if (!depsConfirmed) {
        console.log("Migration cancelled")
        process.exit(0)
      }

      // Process all components
      for (const component of components) {
        await updateComponentUrls(component.id, sourceUserId, targetUserId)
      }

      // Step 2: Copy files to new locations with confirmation for first file
      console.log("\n=== Step 2: Copying files to new locations ===\n")

      const migrationResults = new Map<string, boolean>()
      const fileTypes = [
        { suffix: ".tsx", required: true },
        { suffix: ".demo.tsx", required: true },
        { suffix: ".png", required: true },
        { suffix: ".mp4", required: false },
        { suffix: ".tailwind.config.js", required: false },
        { suffix: ".global.css", required: false },
        { suffix: ".compiled.css", required: false },
      ]

      // Try first file with confirmation
      const firstFileType = fileTypes[0]
      if (!firstFileType) {
        throw new Error("No file types defined")
      }

      const firstOldPath = `${sourceUserId}/${firstComponent.component_slug}${firstFileType.suffix}`
      const firstNewPath = `${targetUserId}/${firstComponent.component_slug}${firstFileType.suffix}`

      console.log(`\nTesting first file migration:`)
      console.log(`From: ${firstOldPath}`)
      console.log(`To: ${firstNewPath}`)

      const firstSuccess = await migrateFile(firstOldPath, firstNewPath, false)

      if (firstSuccess) {
        const filesConfirmed = await askForConfirmation(
          "First file was successfully copied and verified. Continue with remaining files?",
        )

        if (!filesConfirmed) {
          console.log("Migration cancelled")
          process.exit(0)
        }

        // Process all remaining files
        for (const component of components) {
          for (const { suffix, required } of fileTypes) {
            const oldPath = `${sourceUserId}/${component.component_slug}${suffix}`
            const newPath = `${targetUserId}/${component.component_slug}${suffix}`

            if (oldPath === firstOldPath) continue // Skip the first file we already processed

            const success = await migrateFile(oldPath, newPath, false)
            migrationResults.set(oldPath, success)

            if (required && !success) {
              console.error(`Failed to migrate required file: ${oldPath}`)
              process.exit(1)
            }
          }
        }
      } else {
        console.error("Failed to migrate first file, cancelling migration")
        process.exit(1)
      }

      // Step 3: Delete original files after confirmation
      console.log(
        "\n=== All files have been copied and database records updated ===",
      )
      console.log(
        "Would you like to proceed with deleting the original files? (y/n)",
      )

      process.stdin.resume()
      process.stdin.setEncoding("utf8")

      process.stdin.once("data", async (data) => {
        const answer = data.toString().trim().toLowerCase()

        if (answer === "y") {
          console.log("\n=== Step 3: Deleting original files ===\n")

          for (const [oldPath] of migrationResults) {
            if (migrationResults.get(oldPath)) {
              const newPath = oldPath.replace(sourceUserId, targetUserId)
              await migrateFile(oldPath, newPath, true)
            }
          }

          console.log("\n=== Migration completed ===")
        } else {
          console.log(
            "\n=== Keeping original files. Migration completed without deletion ===",
          )
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
