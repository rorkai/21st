import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

async function sendTelegramMessage(message: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN")
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID")
  if (!token || !chatId) {
    throw new Error("Missing Telegram configuration")
  }
  const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`
  const response = await fetch(telegramUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    }),
  })
  if (!response.ok) {
    throw new Error(`Failed to send Telegram message: ${response.statusText}`)
  }
  return await response.json()
}

Deno.serve(async (req) => {
  try {
    const { record } = await req.json()
    if (!record) {
      throw new Error("Record is required")
    }
    const component_id = record.component_id
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") ?? "",
          },
        },
      },
    )
    const { data, error } = await supabase
      .from("components")
      .select("component_slug, user:user_id(username), name, description")
      .eq("id", component_id)
      .single()

    const component_url = `https://21st.dev/${data?.user?.username}/${data?.component_slug}`

    if (error) {
      throw new Error(`Failed to fetch component: ${error.message}`)
    }

    const message =
      `🎉 *New Component Submitted\!*\n\n` +
      `*Component ID:* \`${component_id}\`\n` +
      `*Check it out here:* [View Component](${component_url})\n\n` +
      `*Name:* ${data?.name}\n` +
      `*Description:* ${data?.description}`

    const result = await sendTelegramMessage(message)
    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}) /* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/notify' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"message":"Hello from Telegram!"}'

*/
