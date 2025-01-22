import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function PATCH(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      display_name,
      display_username,
      display_image_url,
      bio,
      website_url,
      github_url,
      twitter_url,
    } = body

    // Validate display_username format if provided
    if (display_username && !/^[a-zA-Z0-9_-]+$/.test(display_username)) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 },
      )
    }

    // Check if display_username is unique across both username and display_username fields
    if (display_username) {
      const { data: existingUsers, error: queryError } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(
          `username.eq."${display_username}",display_username.eq."${display_username}"`,
        )
        .neq("id", userId)

      if (queryError) {
        console.error("Username validation error:", queryError)
        return NextResponse.json(
          { error: "Failed to validate username" },
          { status: 500 },
        )
      }

      if (existingUsers && existingUsers.length > 0) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 },
        )
      }
    }

    // Process URLs
    const processUrl = (url: string | null) => {
      if (!url) return null
      if (url.startsWith("http://") || url.startsWith("https://")) return url
      return `https://${url}`
    }

    // Handle image upload if it's a base64 string
    let finalImageUrl = display_image_url
    if (display_image_url?.startsWith("data:image")) {
      try {
        // Extract base64 data
        const base64Data = display_image_url.split(",")[1]
        const buffer = Buffer.from(base64Data, "base64")

        // Generate file name
        const fileExt = display_image_url.split(";")[0].split("/")[1]
        const fileName = `${userId}/avatar.${fileExt}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage.from("users").upload(fileName, buffer, {
            contentType: `image/${fileExt}`,
            upsert: true,
          })

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
          return NextResponse.json(
            { error: "Failed to upload image" },
            { status: 500 },
          )
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from("users").getPublicUrl(fileName)

        finalImageUrl = publicUrl
      } catch (error) {
        console.error("Error processing image:", error)
        return NextResponse.json(
          { error: "Failed to process image" },
          { status: 500 },
        )
      }
    }

    const updateData: Record<string, any> = {
      display_name: display_name || null,
      display_username: display_username || null,
      display_image_url: finalImageUrl || null,
      bio: bio || null,
      website_url: processUrl(website_url),
      github_url: processUrl(github_url),
      twitter_url: processUrl(twitter_url),
    }

    console.log("Updating user with data:", updateData)

    const { error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)

    if (error) {
      console.error("Update error:", error)
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
