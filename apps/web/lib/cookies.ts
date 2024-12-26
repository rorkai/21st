"use server"

import { cookies } from "next/headers"
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies"

export async function setCookie(cookie: ResponseCookie) {
  cookies().set(cookie)
}
