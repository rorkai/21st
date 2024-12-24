import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  cookies().set("has_visited", "1", {
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: "lax",
  })

  return NextResponse.json({ success: true })
} 