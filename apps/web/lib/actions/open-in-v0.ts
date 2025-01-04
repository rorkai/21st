"use server"

import { z } from "zod"

const v0TemplateSchema = z.object({
  name: z.string(),
  type: z.literal("registry:block"),
  title: z.string(),
  description: z.string(),
  meta: z.object({
    env: z
      .array(
        z.object({
          name: z.string(),
          url: z.string(),
        }),
      )
      .optional(),
  }),
  files: z.array(
    z.object({
      path: z.string(),
      type: z.string(),
      target: z.string().optional(),
      content: z.string(),
    }),
  ),
  dependencies: z.record(z.string()),
})

export async function openInV0Action(template: unknown) {
  const v0ApiKey = process.env.V0_API_KEY

  console.log(
    "Starting openInV0Action with template:",
    JSON.stringify(template, null, 2),
  )
  console.log("V0_API_KEY configured:", !!v0ApiKey)

  if (!v0ApiKey) {
    throw new Error("V0_API_KEY is not configured")
  }

  try {
    console.log("Making request to v0.dev API...")
    const validatedTemplate = v0TemplateSchema.parse(template)

    const response = await fetch("https://v0.dev/chat/api/templates/open", {
      method: "POST",
      headers: {
        "x-v0-edit-secret": v0ApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: 3,
        template: validatedTemplate,
      }),
    })

    console.log("Response status:", response.status)
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    )

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Unauthorized - check your V0_API_KEY")
      }

      const errorText = await response.text()
      console.error("Error from v0.dev:", errorText)
      throw new Error("Failed to open template in v0.dev")
    }

    const data = z
      .object({
        url: z.string(),
      })
      .parse(await response.json())

    console.log("Success response from v0:", data)

    return {
      error: null,
      url: data.url,
    }
  } catch (error) {
    console.error("Error in openInV0Action:", error)

    if (error instanceof z.ZodError) {
      return {
        error: `Invalid template format: ${error.errors[0]?.message ?? "Unknown validation error"}`,
        url: null,
      }
    }

    if (error instanceof Error) {
      return { error: error.message, url: null }
    }

    return {
      error: "Something went wrong. Please try again later.",
      url: null,
    }
  }
}
