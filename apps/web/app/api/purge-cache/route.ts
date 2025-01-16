import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { filesToPurge, pathToRevalidate, tagToRevalidate } = body

    if (!Array.isArray(filesToPurge) || filesToPurge.length === 0) {
      return NextResponse.json(
        { error: "Invalid files array" },
        { status: 400 },
      )
    }

    const zoneId = process.env.CLOUDFLARE_ZONE_ID
    const apiToken = process.env.CLOUDFLARE_PURGE_CACHE_API_KEY
    const cloudflareUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`

    console.log("filesToPurge", filesToPurge)

    const resp = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ files: filesToPurge }),
    })

    const data = await resp.json()
    if (!data.success) {
      return NextResponse.json(
        { error: "Failed to purge CF cache", details: data },
        { status: 500 },
      )
    }

    if (pathToRevalidate) {
      if (Array.isArray(pathToRevalidate)) {
        await Promise.all(pathToRevalidate.map((path) => revalidatePath(path)))
      } else {
        await revalidatePath(pathToRevalidate)
      }
    }

    if (tagToRevalidate) {
      await revalidateTag(tagToRevalidate)
    }

    return NextResponse.json({ success: true, purged: filesToPurge })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
