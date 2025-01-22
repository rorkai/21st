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

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { display_username } = body

    if (!display_username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 },
      )
    }

    // Check if display_username is unique across both username and display_username fields
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

    return NextResponse.json({
      exists: existingUsers && existingUsers.length > 0,
    })
  } catch (error) {
    console.error("Error checking username:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
