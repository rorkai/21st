import { compileCSS } from "@/lib/compileCss"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { code, demoCode } = await req.json()
    const css = await compileCSS(`${code}\n${demoCode}`)
    return NextResponse.json({ css })
  } catch (error) {
    console.error('CSS compilation error:', error)
    return NextResponse.json({ error: 'Failed to compile CSS' }, { status: 500 })
  }
}