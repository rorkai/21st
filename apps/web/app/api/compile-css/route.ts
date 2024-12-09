import { compileCSS } from "@/lib/compileCss"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { code, demoCode, customTailwindConfig, customGlobalCss } = await req.json()
    const filteredCode = code
      .split("\n")
      .filter((line: string) => !line.trim().startsWith("import"))
      .join("\n")
    const filteredDemoCode = demoCode
      .split("\n")
      .filter((line: string) => !line.trim().startsWith("import"))
      .join("\n")
    const css = await compileCSS(
      `${filteredCode}\n${filteredDemoCode}`,
      customTailwindConfig,
      customGlobalCss,
    )
    return NextResponse.json({ css })
  } catch (error) {
    console.error("CSS compilation error:", error)
    return NextResponse.json(
      { error: "Failed to compile CSS" },
      { status: 500 },
    )
  }
}
