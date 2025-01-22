import { NextResponse } from "next/server"
import { Webhook, WebhookRequiredHeaders } from "svix"
import { WebhookEvent } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(req: Request) {
  const payload = await req.text()
  const headersList = req.headers

  const heads = {
    "svix-id": headersList.get("svix-id"),
    "svix-timestamp": headersList.get("svix-timestamp"),
    "svix-signature": headersList.get("svix-signature"),
  }

  // Check if all required headers are present
  if (
    !heads["svix-id"] ||
    !heads["svix-timestamp"] ||
    !heads["svix-signature"]
  ) {
    return NextResponse.json(
      { error: "Missing required headers" },
      { status: 400 },
    )
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    )
  }

  const wh = new Webhook(webhookSecret)
  let evt: WebhookEvent

  try {
    evt = wh.verify(payload, heads as WebhookRequiredHeaders) as WebhookEvent
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    )
  }

  const { type, data: user } = evt

  switch (type) {
    case "user.created":
    case "user.updated":
      try {
        const username =
          user.external_accounts?.[0]?.username || user.username || user.id
        const name =
          `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || null
        const image_url = user.image_url

        // For new users, initialize display fields with Clerk data
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", user.id)
          .single()

        const userData = {
          id: user.id,
          username,
          image_url,
          email: user.email_addresses[0]?.email_address ?? null,
          name,
          // Only set display fields for new users
          ...(existingUser
            ? {}
            : {
                display_name: name,
                display_username: username,
                display_image_url: image_url,
              }),
        }

        const { data, error } = await supabaseAdmin
          .from("users")
          .upsert(userData)

        if (error) {
          return NextResponse.json(
            { error: "Failed to sync user with Supabase", details: error },
            { status: 500 },
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: "Unexpected error during user sync", details: error },
          { status: 500 },
        )
      }
      break

    case "user.deleted":
      // eslint-disable-next-line no-case-declarations
      const { error: deleteError } = await supabaseAdmin
        .from("users")
        .delete()
        .match({ id: user.id })

      if (deleteError) {
        return NextResponse.json(
          { error: "Failed to delete user from Supabase" },
          { status: 500 },
        )
      }
      break

    default:
  }
  return NextResponse.json({ message: "Webhook processed successfully" })
}

export async function GET() {
  return NextResponse.json({ message: "Clerk webhook endpoint" })
}
