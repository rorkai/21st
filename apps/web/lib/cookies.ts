"use server"

import { cookies } from "next/headers"

export async function isReturningUser() {
  const cookieStore = cookies()
  const hasVisited = cookieStore.has("has_visited")

  if (!hasVisited) {
    cookies().set("has_visited", "1", {
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
    })
    return false
  }

  return true
}
